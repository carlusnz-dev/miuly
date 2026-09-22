---
name: security-review
description: Avaliar segurança e privacidade do Miuly quando mudanças envolverem autenticação, OAuth, dados pessoais, exposição HTTP ou configuração operacional.
---

# Revisão de Segurança

Modele ativos, limites de confiança, ator e abuso plausível antes de recomendar
controles. Priorize autorização por objeto, gestão de sessão, OAuth com menor
escopo, rotação e armazenamento de tokens, validação de entrada, rate limit,
segredos hardcoded, logging sensível, CORS/CSRF, headers e dependências.

`robots.txt` orienta crawlers e não protege recursos. Privacidade exige minimização,
finalidade, retenção, exclusão e controle de acesso. Nunca copie segredos reais para
relatórios ou testes.

Classifique achados por probabilidade e impacto, inclua evidência e mitigação
proporcional. Diferencie requisito imediato de hardening. Não execute exploração,
rotação, revogação ou mudança externa sem autorização; respeite o `AGENTS.md`.
