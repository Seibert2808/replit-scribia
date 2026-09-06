import type { CSSProperties } from 'react'

/**
 * Fundo indigo do portfolio do ScribIA.
 *
 * Troca SO AS SUPERFICIES e o texto. O roxo da marca fica intacto em
 * botoes, links e destaques: e isso que faz a pagina parecer o portfolio,
 * que e azul escuro COM a cor do ScribIA por cima, e nao a pagina de
 * outra empresa.
 *
 * ARMADILHA: o index.css usa "@theme inline", entao o Tailwind SUBSTITUI
 * o valor no build. Trocar --color-bg em tempo de execucao nao faz nada,
 * porque a classe bg-bg ja compilou para var(--background). Os nomes
 * abaixo sao os que as classes realmente leem, conferidos no CSS gerado.
 *
 * Consequencia: o que estiver como valor literal no @theme nao da para
 * trocar assim, e e o caso do --color-text3. Ele fica no cinza original.
 * Contraste conferido sobre o indigo, continua legivel.
 *
 * Aplicar num container faz tudo que estiver dentro adotar sozinho, e
 * desfazer e tirar o style.
 */
export const FUNDO_PORTFOLIO = {
  '--background': '#1B1930',
  '--card': '#232041',
  '--muted': '#2C2950',
  '--secondary': '#232041',
  '--foreground': '#F2F3F9',
  '--muted-foreground': '#C7CAD8',
  '--border': '#332F5A',

  // AS VARIAVEIS DE TEXTO SAO SEPARADAS POR SUPERFICIE, e esquecer uma
  // deixa texto preto sobre o indigo. Foi o que aconteceu no formulario
  // de contato: o cartao usa --card-foreground, e nao --foreground.
  '--card-foreground': '#F2F3F9',
  '--popover': '#232041',
  '--popover-foreground': '#F2F3F9',
  '--secondary-foreground': '#F2F3F9',
  '--accent': '#3566CF',
  '--accent-foreground': '#FFFFFF',
  // Borda dos campos de formulario, que tem variavel propria.
  '--input': '#3A3566',
  '--ring': '#698DC5',
} as CSSProperties

/**
 * Gradiente da marca: o roxo e o azul do logo, na mesma inclinacao usada
 * no guia. Substitui o roxo-para-roxo que os titulos usavam, e e o que
 * traz o azul para as secoes claras sem repinta-las.
 */
export const GRADIENTE_MARCA = 'linear-gradient(135deg, #725EA8, #698DC5)'

/**
 * O mesmo gradiente com os tons CLAREADOS, para titulo sobre o fundo
 * indigo. O gradiente normal fica com pouco contraste no escuro: o roxo
 * #725EA8 sobre #1B1930 e quase ilegivel em texto.
 */
export const GRADIENTE_MARCA_CLARO = 'linear-gradient(135deg, #A794DC, #96ABE8)'
