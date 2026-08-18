// Empêche un appel (réseau ou autre) de bloquer silencieusement le reste de l'app pour
// toujours : sans ça, une requête qui ne répond jamais (mauvais réseau, websocket
// bloqué...) peut geler toute la file d'attente locale derrière elle, sans aucune erreur
// visible ni pour l'utilisateur ni pour nous.
export function avecTimeout<T>(promesse: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const minuteur = setTimeout(() => {
      reject(new Error(`${label} : délai dépassé (${ms / 1000}s), probablement un problème réseau.`));
    }, ms);
    promesse.then(
      (valeur) => {
        clearTimeout(minuteur);
        resolve(valeur);
      },
      (erreur) => {
        clearTimeout(minuteur);
        reject(erreur);
      }
    );
  });
}
