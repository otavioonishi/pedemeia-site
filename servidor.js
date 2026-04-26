const express = require('express');
const fs      = require('fs');
const crypto  = require('crypto');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'usuarios.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function lerDB() {
  if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

function salvarDB(dados) {
  fs.writeFileSync(DB, JSON.stringify(dados, null, 2));
}

function hashSenha(senha) {
  return crypto.createHash('sha256').update(senha + 'pedemeia_salt_2025').digest('hex');
}

app.post('/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'Senha precisa ter pelo menos 6 caracteres.' });
  const usuarios = lerDB();
  if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
  usuarios.push({ id: Date.now().toString(), nome: nome.trim(), email: email.toLowerCase().trim(), senha: hashSenha(senha), criadoEm: new Date().toISOString() });
  salvarDB(usuarios);
  res.status(201).json({ mensagem: 'Conta criada com sucesso!' });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  const usuario = lerDB().find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === hashSenha(senha));
  if (!usuario) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  res.json({ mensagem: 'Login realizado!', usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
});

app.get('/admin/usuarios', (req, res) => {
  if (req.query.chave !== 'minhasenhaadmin') return res.status(403).json({ erro: 'Acesso negado.' });
  const usuarios = lerDB().map(u => ({ id: u.id, nome: u.nome, email: u.email, criadoEm: u.criadoEm }));
  res.json({ total: usuarios.length, usuarios });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
