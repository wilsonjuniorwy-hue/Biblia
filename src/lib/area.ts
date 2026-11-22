/** Página inicial da área em que a pessoa está (Igreja, Devocional ou Estudos), para o botão Voltar das telas compartilhadas. */
export function areaHome(): string {
  try {
    const a = sessionStorage.getItem('area');
    return a === 'igreja' ? '/igreja' : a === 'devocional' ? '/devocional' : '/estudos';
  } catch {
    return '/estudos';
  }
}
