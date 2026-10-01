# Dante Giovanni Training

## Executar

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend: abra `frontend/index.html` com Live Server (porta 5500 é suficiente).

## Código para criação de contas

Em desenvolvimento o código padrão é ``. Em produção, defina a variável de ambiente `DANTE_INVITE_CODE` com exatamente 5 caracteres alfanuméricos e não publique o código no repositório.

Exemplo PowerShell antes de iniciar o backend:

```powershell
$env:DANTE_INVITE_CODE="X7K2P"
uvicorn main:app --reload
```

Professores e alunos podem criar a própria conta pelo login. Alunos escolhem o professor responsável durante o cadastro. O login permanece salvo no navegador até o usuário clicar em Sair.

## Contato (Instagram e WhatsApp)
A aba Contato já está pronta. Como os links oficiais não foram informados, configure-os no navegador uma vez pelo Console:

```js
localStorage.DANTE_INSTAGRAM = "https://instagram.com/SEU_USUARIO";
localStorage.DANTE_WHATSAPP = "https://wa.me/55DDDNUMERO";
location.reload();
```
