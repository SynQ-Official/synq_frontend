# Licences des ambiances sonores

Règle : **seuls des sons CC0 (domaine public) ou créés par SynQ**. Un son sous une autre licence (CC-BY, CC-BY-NC,
etc.) ne rentre pas, même avec attribution.

Les fichiers audio ne sont pas dans git : ils vivent dans `ambiances-src/` (à côté du repo). Les chemins de fichier
ci-dessous sont relatifs à ce dossier. Ce document, lui, est versionné.

## 1. Sons générés par SynQ (aucun tiers)

Créés par synthèse avec ffmpeg (`anoisesrc`), aucun enregistrement ni échantillon externe.
Reproductibles à l'identique : `synq_frontend/scripts/ambiances/generate-noise.sh` (graines fixes).

| Fichier | Titre | Auteur | Source | Licence |
|---|---|---|---|---|
| `generated/noise-pink.m4a`, `generated/noise-pink.opus` | Bruit rose, boucle de 90 s | SynQ | Généré (ffmpeg `anoisesrc color=pink`) | Création SynQ, aucun tiers |
| `generated/noise-white.m4a`, `generated/noise-white.opus` | Bruit blanc, boucle de 90 s | SynQ | Généré (ffmpeg `anoisesrc color=white`) | Création SynQ, aucun tiers |

Ces bruits ne sont proposés qu'à la track TDAH. Jamais à la track psychose.

## 2. Sons Freesound (CC0) : TODO

Dossiers sources : `adhd/` (boucles Lo-Fi), `bipolar/` (musiques douces), `psychosis/` (sons de la nature réguliers,
sans voix, sans variation brusque). **Ils sont vides pour l'instant.**

À remplir pour chaque son ajouté. Ne rien deviner : tant que le titre, l'auteur et l'URL ne sont pas connus, laisser
`TODO`. Vérifier sur la page du son que la licence affichée est bien « Creative Commons 0 ».

| Fichier | Titre | Auteur | URL Freesound | Licence |
|---|---|---|---|---|
| TODO | TODO | TODO | TODO | CC0 |

Contrôle avant mise en ligne : aucune ligne `TODO` restante, aucune licence autre que CC0.
