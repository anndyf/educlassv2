"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Helper de envio de email
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

async function sendNotificationEmail(to: string, subject: string, content: string, senderName: string) {
    const emailSubject = `Nova Mensagem: ${subject}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a;">Nova mensagem recebida</h2>
        <p style="color: #475569;">Você recebeu uma nova mensagem de <strong>${senderName}</strong> no Sistema de Notas CETEP/LNAB.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Assunto</p>
          <p style="margin: 5px 0 15px 0; color: #0f172a; font-weight: bold;">${subject}</p>
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Mensagem</p>
          <p style="margin: 5px 0 0 0; color: #334155; white-space: pre-wrap;">${content}</p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/mensagens" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ler no Sistema</a>
      </div>
    `;

    try {
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Sistema de Notas" <no-reply@cetep.edu.br>',
                to,
                subject: emailSubject,
                html,
            });
        } else if (resend) {
            await resend.emails.send({
                from: process.env.RESEND_FROM || 'onboarding@resend.dev',
                to,
                subject: emailSubject,
                html,
            });
        }
    } catch (e) {
        console.error("Erro ao enviar email de notificação", e);
    }
}

export async function sendMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Não autorizado" }
  }

  const subject = formData.get("subject") as string
  const content = formData.get("content") as string
  const category = formData.get("category") as string
  const receiverId = formData.get("receiverId") as string | null
  const parentId = formData.get("parentId") as string | null
  const allowReplies = formData.get("allowReplies") !== "false" 

  if (!subject || !content || !category) {
    return { error: "Campos obrigatórios faltando" }
  }

  // Validação de Permissão: Professores (Staff sem ser Admin/Direção)
  const user = session.user as any
  const isTeacherOnly = user.isStaff && !user.isSuperuser && !user.isDirecao
  
  if (isTeacherOnly) {
      if (category === "GERAL" && !parentId) {
          return { error: "Você não tem permissão para enviar mensagens diretas." }
      }
      
      if (category === "COMUNICADO") {
          if (!receiverId || !receiverId.startsWith("TURMA_")) {
              return { error: "Você só pode enviar comunicados para suas turmas específicas." }
          }
          
          const targetTurmaId = receiverId.replace("TURMA_", "")
          const hasPermission = await prisma.disciplina.findFirst({
              where: {
                  turmaId: targetTurmaId,
                  usuariosPermitidos: {
                      some: { id: user.id }
                  }
              }
          })
          
          if (!hasPermission) {
              return { error: "Você não tem permissão para enviar comunicados para esta turma." }
          }
      }
  }

  try {
    let targetReceiverId = receiverId;

    if (category === "SUPORTE" || category === "DIRECAO") {
       targetReceiverId = null;
    }
    if (category === "COMUNICADO" && !receiverId) {
        targetReceiverId = null; 
    }

    const newMessage = await prisma.message.create({
      data: {
        subject,
        content,
        category: category as any,
        senderId: user.id,
        receiverId: targetReceiverId || undefined,
        isRead: false,
        parentId: parentId || undefined,
        allowReplies
      }
    })

    if (category === "GERAL" && targetReceiverId) {
        const receiver = await prisma.user.findUnique({ where: { id: targetReceiverId } });
        if (receiver && receiver.email) {
            sendNotificationEmail(receiver.email, subject, content, user.name || user.username);
        }
    }
    
    if (category === "SUPORTE" || category === "DIRECAO") {
        const admins = await prisma.user.findMany({
            where: {
                OR: [
                    { isSuperuser: true },
                    ...(category === "DIRECAO" ? [{ isDirecao: true }] : [])
                ],
                isActive: true
            },
            select: { email: true }
        });
        
        for (const admin of admins) {
            if (admin.email) sendNotificationEmail(admin.email, subject, content, user.name || user.username);
        }
    }

    revalidatePath("/dashboard/mensagens")
    return { success: true }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return { error: "Erro ao enviar mensagem" }
  }
}

export async function markAsRead(id: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const existingRead = await prisma.messageRead.findUnique({
      where: {
          messageId_userId: {
              messageId: id,
              userId: session.user.id
          }
      }
  })

  if (!existingRead) {
      await prisma.messageRead.create({
          data: {
              messageId: id,
              userId: session.user.id
          }
      })
  }
  
  revalidatePath("/dashboard/mensagens")
}

export async function deleteMessage(messageId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Não autorizado" }

    try {
        await prisma.messageDelete.create({
            data: {
                messageId,
                userId: session.user.id
            }
        })
        revalidatePath("/dashboard/mensagens")
        return { success: true }
    } catch (e) {
        console.error("Erro ao deletar mensagem:", e)
        return { error: "Erro ao deletar mensagem" }
    }
}

export async function getMessages(options: { page?: number, limit?: number, type?: 'all' | 'received' | 'sent' } = {}) {
  const { page = 1, limit = 20, type = 'all' } = options;
  const skip = (page - 1) * limit;

  const session = await auth()
  if (!session?.user?.id) return { received: [], sent: [] } 

  const user = session.user as any
  let received: any[] = []
  let sent: any[] = []

  if (type === 'all' || type === 'received') {
      const allowedReceiverIds: (string | null)[] = [null];

      if (user.isStaff) allowedReceiverIds.push('GROUP_TEACHERS');
      if (user.isStaff || user.isSuperuser) allowedReceiverIds.push('GROUP_STAFF');
      if (user.isDirecao || user.isSuperuser) allowedReceiverIds.push('GROUP_DIRECAO');
      if (user.estudanteId) allowedReceiverIds.push('GROUP_STUDENTS');

      if (user.isStaff) {
          const teacher = await prisma.user.findUnique({
              where: { id: user.id },
              include: { disciplinasPermitidas: { select: { turmaId: true } } }
          });
          const teacherTurmas = teacher?.disciplinasPermitidas.map((d: any) => `TURMA_${d.turmaId}`) || [];
          allowedReceiverIds.push(...teacherTurmas);
      }

      if (user.estudanteId) {
          const student = await prisma.user.findUnique({
             where: { id: user.id },
             include: { estudante: { select: { turmaId: true } } }
          });
          if (student?.estudante?.turmaId) {
              allowedReceiverIds.push(`TURMA_${student.estudante.turmaId}`);
          }
      }

      const allowedReceiverStrings = allowedReceiverIds.filter((id): id is string => id !== null);

      const whereConditions: any[] = [
        { receiverId: user.id },
        { 
          AND: [
            { category: "COMUNICADO" },
            { senderId: { not: user.id } },
            {
              OR: [
                { receiverId: null },
                { receiverId: { in: allowedReceiverStrings } }
              ]
            }
          ]
        }
      ]

      if (user.isSuperuser) whereConditions.push({ category: "SUPORTE" })
      if (user.isDirecao || user.isSuperuser) whereConditions.push({ category: "DIRECAO" })
      
      const receivedRaw = await prisma.message.findMany({
        where: { 
            AND: [
                { OR: whereConditions },
                { deletedBy: { none: { userId: user.id } } }
            ]
        },
        include: {
          sender: { select: { id: true, name: true, email: true, username: true } },
          readBy: { where: { userId: user.id }, select: { id: true } } 
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      })

      received = receivedRaw.map((msg: any) => ({
          ...msg,
          isRead: msg.readBy.length > 0
      }))
  }

  if (type === 'all' || type === 'sent') {
      sent = await prisma.message.findMany({
        where: { 
            senderId: user.id,
            deletedBy: { none: { userId: user.id } }
        },
        include: {
            receiver: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      })
  }

  return { received, sent }
}

export async function getUsersForSelect() {
    const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            username: true,
            isSuperuser: true,
            isDirecao: true,
            isStaff: true,
            estudanteId: true,
            isPortalUser: true
        },
        orderBy: { name: 'asc' }
    })
    return users
}

export async function getTurmasForSelect() {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = session.user as any
    const isTeacherOnly = user.isStaff && !user.isSuperuser && !user.isDirecao
    const where: any = { anoLetivo: 2026 }

    if (isTeacherOnly) {
        where.disciplinas = {
            some: {
                usuariosPermitidos: {
                    some: { id: user.id }
                }
            }
        }
    }

    const turmas = await prisma.turma.findMany({
        where,
        select: {
            id: true,
            nome: true,
            curso: true,
            serie: true
        },
        orderBy: { nome: 'asc' }
    })
    return turmas
}

export async function getUnreadCount() {
    const session = await auth()
    if (!session?.user?.id) return 0
  
    const user = session.user as any
  
    const allowedReceiverIds: (string | null)[] = [null];

    if (user.isStaff) allowedReceiverIds.push('GROUP_TEACHERS');
    if (user.isStaff || user.isSuperuser) allowedReceiverIds.push('GROUP_STAFF');
    if (user.isDirecao || user.isSuperuser) allowedReceiverIds.push('GROUP_DIRECAO');
    if (user.estudanteId) allowedReceiverIds.push('GROUP_STUDENTS');

     if (user.isStaff) {
        const teacher = await prisma.user.findUnique({
            where: { id: user.id },
            include: { disciplinasPermitidas: { select: { turmaId: true } } }
        });
        const teacherTurmas = teacher?.disciplinasPermitidas.map((d: any) => `TURMA_${d.turmaId}`) || [];
        allowedReceiverIds.push(...teacherTurmas);
    }

    if (user.estudanteId) {
        const student = await prisma.user.findUnique({
           where: { id: user.id },
           include: { estudante: { select: { turmaId: true } } }
        });
        if (student?.estudante?.turmaId) {
            allowedReceiverIds.push(`TURMA_${student.estudante.turmaId}`);
        }
    }

    const allowedReceiverStrings = allowedReceiverIds.filter((id): id is string => id !== null);
    
    const whereConditions: any[] = [
      { receiverId: user.id },
      { 
        AND: [
          { category: "COMUNICADO" },
          { senderId: { not: user.id } },
          {
             OR: [
               { receiverId: null },
               { receiverId: { in: allowedReceiverStrings } }
             ]
          }
        ]
      }
    ]
  
    if (user.isSuperuser) whereConditions.push({ category: "SUPORTE" })
    if (user.isDirecao || user.isSuperuser) whereConditions.push({ category: "DIRECAO" })
  
    const count = await prisma.message.count({
      where: {
          AND: [
              { OR: whereConditions },
              {
                  readBy: {
                      none: {
                          userId: user.id
                      }
                  }
              },
              {
                  deletedBy: {
                      none: {
                          userId: user.id
                      }
                  }
              }
          ]
      }
    })
  
    return count
}

export async function getLatestUnreadMessage() {
    const session = await auth()
    if (!session?.user?.id) return null
  
    const user = session.user as any
    const allowedReceiverIds: (string | null)[] = [null];

    if (user.isStaff) allowedReceiverIds.push('GROUP_TEACHERS');
    if (user.isStaff || user.isSuperuser) allowedReceiverIds.push('GROUP_STAFF');
    if (user.isDirecao || user.isSuperuser) allowedReceiverIds.push('GROUP_DIRECAO');
    if (user.estudanteId) allowedReceiverIds.push('GROUP_STUDENTS');

     if (user.isStaff) {
        const teacher = await prisma.user.findUnique({
            where: { id: user.id },
            include: { disciplinasPermitidas: { select: { turmaId: true } } }
        });
        const teacherTurmas = teacher?.disciplinasPermitidas.map((d: any) => `TURMA_${d.turmaId}`) || [];
        allowedReceiverIds.push(...teacherTurmas);
    }

    if (user.estudanteId) {
        const student = await prisma.user.findUnique({
           where: { id: user.id },
           include: { estudante: { select: { turmaId: true } } }
        });
        if (student?.estudante?.turmaId) {
            allowedReceiverIds.push(`TURMA_${student.estudante.turmaId}`);
        }
    }

    const allowedReceiverStrings = allowedReceiverIds.filter((id): id is string => id !== null);

    const whereConditions: any[] = [
      { receiverId: user.id },
      { 
        AND: [
          { category: "COMUNICADO" },
          { senderId: { not: user.id } },
          {
             OR: [
               { receiverId: null },
               { receiverId: { in: allowedReceiverStrings } }
             ]
          }
        ]
      }
    ]
  
    if (user.isSuperuser) whereConditions.push({ category: "SUPORTE" })
    if (user.isDirecao || user.isSuperuser) whereConditions.push({ category: "DIRECAO" })
  
    const latest = await prisma.message.findFirst({
      where: {
          AND: [
              { OR: whereConditions },
              {
                  readBy: {
                      none: {
                          userId: user.id
                      }
                  }
              },
              {
                  deletedBy: {
                      none: {
                          userId: user.id
                      }
                  }
              }
          ]
      },
      include: {
        sender: { select: { name: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  
    return latest
}

export async function getMessageThread(messageId: string) {
    const session = await auth()
    if (!session?.user?.id) return []
    const userId = session.user.id
    
    const target = await prisma.message.findUnique({ 
        where: { id: messageId },
        select: { id: true, parentId: true }
    })
    
    if (!target) return []

    const rootId = target.parentId || target.id

    const thread = await prisma.message.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { id: rootId },
                        { parentId: rootId }
                    ]
                },
                {
                    deletedBy: {
                        none: {
                            userId: userId
                        }
                    }
                }
            ]
        },
        include: {
            sender: { select: { id: true, name: true, email: true, username: true } }
        },
        orderBy: { createdAt: 'asc' }
    })
    
    return thread
}
