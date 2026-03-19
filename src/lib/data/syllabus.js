import { db } from '../db.js';

export const syllabus = [
  {
    name: 'Noções de Direito Processual Penal',
    weight: 8,
    topics: [
      { name: 'Princípios gerais do processo penal' },
      { name: 'Sistemas processuais penais' },
      { name: 'Funções de Polícia Administrativa e Judiciária' },
      { name: 'Inquérito policial' },
      { name: 'Ação penal pública e privada' },
      { name: 'Teoria geral das provas (art. 155-239 CPP)' },
      { name: 'Perícias' },
      { name: 'Interrogatório, confissão e testemunhas' },
      { name: 'Reconhecimento e acareação' },
      { name: 'Agente infiltrado e prova virtual' },
      { name: 'Sigilos e interceptações' },
      { name: 'Busca e apreensão (art. 240-250)' },
      { name: 'Cadeia de custódia e cadeia virtual' },
      { name: 'Conceito e espécies de prisão' },
      { name: 'Prisão em flagrante' },
      { name: 'Prisão temporária (Lei 7.960/89)' },
      { name: 'Prisão preventiva' },
      { name: 'Medidas cautelares diversas' },
      { name: 'Fiança e uso de algemas (SV 11)' },
      { name: 'Lei 12.037/09 - Identificação criminal' },
      { name: 'Lei 12.830/13 - Investigação pelo delegado' }
    ]
  },
  {
    name: 'Noções de Direito Constitucional',
    weight: 6,
    topics: [
      { name: 'Conceito e classificação da Constituição' },
      { name: 'Princípios Fundamentais da CRFB' },
      { name: 'Direitos individuais e coletivos' },
      { name: 'Habeas Corpus, Habeas Data e Mandado de Segurança' },
      { name: 'Organização Político-Administrativa' },
      { name: 'Poderes Executivo, Legislativo e Judiciário' },
      { name: 'Funções Essenciais à Justiça' },
      { name: 'Presidente e Vice: Atribuições e Responsabilidades' },
      { name: 'Supremo Tribunal Federal (Art. 101 ao 103)' },
      { name: 'Ministério Público e Defensoria (Art. 127 a 135)' },
      { name: 'Congresso Nacional (Art. 44 a 56)' },
      { name: 'Defesa do Estado e Segurança Pública' },
      { name: 'Constituição do Estado de SC' }
    ]
  },
  {
    name: 'Noções de Direito Administrativo',
    weight: 6,
    topics: [
      { name: 'Conceito, fontes e princípios' },
      { name: 'Estado, governo e administração' },
      { name: 'Administração direta e indireta' },
      { name: 'Agentes públicos' },
      { name: 'Poderes administrativos' },
      { name: 'Serviços públicos' },
      { name: 'Atos administrativos' },
      { name: 'Licitação (14.133/21)' },
      { name: 'Contratos administrativos' },
      { name: 'Responsabilidade civil do Estado' },
      { name: 'Lei 8.429/92 - Improbidade Administrativa' },
      { name: 'Lei 12.527/11 - Acesso à informação' },
      { name: 'Lei 13.709/18 - LGPD' }
    ]
  },
  {
    name: 'Noções de Direitos Humanos',
    weight: 5,
    topics: [
      { name: 'Conceito e noções gerais' },
      { name: 'Direitos humanos na ONU e Declaração Universal' },
      { name: 'Sistema Interamericano e Corte' },
      { name: 'Incorporação ao direito brasileiro' },
      { name: 'Uso de instrumentos de menor potencial ofensivo (Lei 13.060/14)' },
      { name: 'Regulamento do uso da força (Decreto 12.341/24)' }
    ]
  },
  {
    name: 'Legislação Institucional',
    weight: 4,
    topics: [
      { name: 'Lei 14.735/23 - Lei Orgânica Nacional' },
      { name: 'Lei 6.843/86 - Estatuto PC-SC' },
      { name: 'Plano de carreira - LC 453/2009' },
      { name: 'Estatuto Jurídico Disciplinar - LC 491/2010' },
      { name: 'Jornada de Trabalho e Banco de Horas PCSC' },
      { name: 'Lei Complementar n. 741/19' }
    ]
  },
  {
    name: 'Tecnologia da Informação e Crimes Digitais',
    weight: 20,
    topics: [
      { name: 'Redes LAN, WAN, MAN e Protocolos' },
      { name: 'IPv4, IPv6, DNS, VPN e Cloud' },
      { name: 'Deep Web, Dark Web e Navegação Anônima' },
      { name: 'Sistemas móveis, ERBs e Identificação' },
      { name: 'Segurança: Vírus, Malwares, Firewall e MFA' },
      { name: 'Cadeia de Custódia Digital e Código Hash' },
      { name: 'Criptografia e Metadados' },
      { name: 'Mensageria e Redes Sociais' },
      { name: 'Machine Learning, Redes Neurais e LLMs' },
      { name: 'Bitcoin, Chaves, Carteiras e Rastreamento' },
      { name: 'Marco Civil - Lei 12.965/14' },
      { name: 'Crimes Cibernéticos: Conceitos e Classificação' }
    ]
  },
  {
    name: 'Noções de Contabilidade',
    weight: 6,
    topics: [
      { name: 'Princípios Fundamentais (NBC PG 100)' },
      { name: 'Escrituração e Demonstrações' },
      { name: 'Balanço Patrimonial e DRE' },
      { name: 'Perícia (Laudo vs Parecer)' },
      { name: 'Fluxo de Caixa e Valor Adicionado' },
      { name: ' Direito Societário e LC 123/2006 (Simples)' }
    ]
  },
  {
    name: 'Língua Portuguesa',
    weight: 20,
    topics: [
      { name: 'Compreensão e Interpretação de textos' },
      { name: 'Ortografia e Classes de palavras' },
      { name: 'Morfossintaxe: Coordenação e Subordinação' },
      { name: 'Concordância, Regência e Crase' },
      { name: 'Pontuação e Colocação pronominal' },
      { name: 'Significação das palavras e Reescrita' },
      { name: 'Redação Oficial' }
    ]
  },
  {
    name: 'Raciocínio Lógico-Matemático',
    weight: 15,
    topics: [
      { name: 'Proposições, Conectivos e Tabelas Verdade' },
      { name: 'Conjuntos, Diagramas e Números' },
      { name: 'Porcentagem, Juros e Proporcionalidade' },
      { name: 'Medidas e Conversão de unidades' },
      { name: 'Geometria: Ângulos, Triângulos e Polígonos' },
      { name: 'Estatística: Média, Moda e Mediana' }
    ]
  },
  {
    name: 'Direito Penal',
    weight: 10,
    topics: [
      { name: 'Introdução e Princípios do Direito Penal' },
      { name: 'Conceito de crime e Bem jurídico' },
      { name: 'Tipicidade, Ilicitude e Culpabilidade' },
      { name: 'Erro de tipo e erro de proibição' },
      { name: 'Consumação, Tentativa e Arrependimento' },
      { name: 'Concurso de pessoas e crimes' },
      { name: 'Extinção da punibilidade' },
      { name: 'Crimes contra a Pessoa e Patrimônio' },
      { name: 'Crimes contra a Dignidade e Fé Pública' },
      { name: 'Crimes contra a Administração e Estado' }
    ]
  }
];

export async function seedSyllabus() {
  const count = await db.subjects.count();
  if (count > 0) return; // Skip if already has subjects

  console.log('Seeding syllabus...');
  
  for (let i = 0; i < syllabus.length; i++) {
    const s = syllabus[i];
    const subjectId = await db.subjects.add({
      name: s.name,
      weight: s.weight,
      order: i + 1,
      stats: {
        totalCards: 0,
        matureCards: 0,
        learningCards: 0,
        newCards: 0,
        averageEase: 5,
        retention: 0
      }
    });

    for (let j = 0; j < s.topics.length; j++) {
      const t = s.topics[j];
      const topicId = await db.topics.add({
        subjectId,
        name: t.name,
        order: j + 1
      });

      // Optional: Add a placeholder lesson for each topic
      await db.lessons.add({
        topicId,
        title: `Introdução: ${t.name}`,
        order: 1,
        completed: 0
      });
    }
  }
  
  return true;
}
