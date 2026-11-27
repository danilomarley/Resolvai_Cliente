import './Help.css'

const topics: { question: string; answer: string[] }[] = [
  {
    question: 'Como funciona, do pedido ao serviço pronto?',
    answer: [
      'Você publica o pedido, recebe propostas de profissionais, escolhe uma, assina o contrato junto com o profissional, paga por Pix e, quando o serviço estiver pronto, confirma a conclusão e avalia.',
      'Em cada pedido, as abas Detalhes, Propostas, Contrato, Pagamento e Acompanhamento mostram em que passo você está. O cartão "Próximo passo" aponta o que fazer agora.',
    ],
  },
  {
    question: 'Como crio um pedido?',
    answer: [
      'Em "Criar pedido" você conversa com o assistente de IA, que monta o escopo com o que você contar, ou prefere preencher o formulário direto. Antes de publicar você revisa todos os campos.',
      'O que você escreveu fica guardado nesta aba do navegador: se recarregar a página, o rascunho volta. As fotos precisam ser escolhidas de novo.',
      'Para criar o primeiro pedido, a plataforma pede que você finalize o cadastro (documento, endereço e contato).',
    ],
  },
  {
    question: 'Posso editar ou cancelar um pedido?',
    answer: [
      'Sim, enquanto o pedido estiver recebendo propostas e você ainda não tiver aceitado nenhuma. Depois do aceite, o pedido não pode mais ser editado nem cancelado por essas telas.',
      'Ao cancelar, as propostas já enviadas são encerradas. O motivo do cancelamento é opcional.',
    ],
  },
  {
    question: 'Como comparo e aceito uma proposta?',
    answer: [
      'Na aba Propostas você ordena por avaliação, preço ou prazo e pode comparar de 2 a 3 propostas lado a lado. Abra uma proposta para ver os detalhes do profissional.',
      'Ao aceitar uma proposta, as demais são encerradas. O serviço só começa depois do contrato e do pagamento.',
    ],
  },
  {
    question: 'Como funciona o contrato?',
    answer: [
      'Quando você aceita a proposta, o contrato é gerado com o valor, o prazo e a garantia combinados. Você e o profissional precisam assinar; a data e o IP de cada assinatura ficam registrados.',
      'O pagamento só é liberado depois que as duas partes assinam. A tela do contrato se atualiza sozinha quando o profissional assina.',
    ],
  },
  {
    question: 'Como pago?',
    answer: [
      'O pagamento é por Pix. Em Pagamento, clique em "Gerar Pix" e pague pelo QR Code ou pelo código copia e cola no app do seu banco. O Pix vale por 30 minutos; se expirar, é só gerar outro.',
      'A tela confere o pagamento sozinha, sem precisar recarregar. Quando for confirmado, o pedido passa para "Em andamento".',
    ],
  },
  {
    question: 'E depois que o serviço termina?',
    answer: [
      'Em Acompanhamento, ou no cartão "Próximo passo", use "Confirmar conclusão". Essa confirmação não pode ser desfeita.',
      'Com o pedido concluído, você pode avaliar o profissional de 1 a 5 estrelas, com um comentário opcional. A avaliação é pública, então evite colocar telefone, endereço ou outros dados pessoais.',
    ],
  },
  {
    question: 'Como altero meus dados ou minha senha?',
    answer: [
      'Em "Minha conta" você vê os dados do cadastro, atualiza nome, endereço e contato, e troca a senha. O CPF não pode ser alterado.',
    ],
  },
]

/** Central de ajuda (/ajuda): perguntas e respostas sobre o caminho do pedido, do pedido ao serviço pronto. */
export function HelpPage() {
  return (
    <section className="help-page">
      <div className="page-heading">
        <div>
          <h1>Central de ajuda</h1>
          <p>Respostas rápidas sobre como usar a plataforma, do pedido até a avaliação do serviço.</p>
        </div>
      </div>
      <div className="help-list">
        {topics.map((topic) => (
          <details className="panel help-topic" key={topic.question}>
            <summary>{topic.question}</summary>
            {topic.answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </details>
        ))}
      </div>
    </section>
  )
}
