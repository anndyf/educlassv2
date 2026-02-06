import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarEmailConfirmacaoCadastro } from '@/lib/mail'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ message: 'Nome e e-mail são obrigatórios' }, { status: 400 })
    }

    // Verificar se já existe um usuário com este e-mail
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Este e-mail já está cadastrado ou em processo de aprovação' }, { status: 400 })
    }

    // Criar o usuário como desativado, não aprovado, e com uma senha temporária complexa que será trocada no primeiro acesso REAL
    // Para simplificar o fluxo de aprovação posterior, vamos salvar os dados básicos.
    // A senha será gerada apenas na aprovação de fato.
    
    await prisma.user.create({
      data: {
        name,
        email,
        username: email,
        password: 'PENDING_APPROVAL_' + Math.random().toString(36).substring(7),
        isApproved: false,
        isActive: false, // Inativo até aprovação
        isStaff: true,   // Por padrão é professor
      }
    })

    // Enviar e-mail de confirmação que recebemos a solicitação
    try {
      await enviarEmailConfirmacaoCadastro(email, name);
    } catch (mailError) {
      console.error('Erro ao enviar e-mail de confirmação:', mailError);
    }

    return NextResponse.json({ message: 'Solicitação de cadastro enviada com sucesso' }, { status: 201 })

  } catch (error: any) {
    console.error('ERRO AO REGISTRAR PROFESSOR:', error)
    return NextResponse.json({ message: 'Erro interno ao processar cadastro' }, { status: 500 })
  }
}
