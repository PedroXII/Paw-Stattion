const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Testar conexão com o banco
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API PawStation está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário pelo email
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    // Verificar senha (em produção, usar bcrypt.compare)
    // Por enquanto, vamos usar uma verificação simples para testes
    const isPasswordValid = password === 'admin123'; // Temporário para testes

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        tipo: user.tipo 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.tipo
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rota para listar animais (pública)
app.get('/api/animals', async (req, res) => {
  try {
    const { species, status } = req.query;

    let query = 'SELECT * FROM animais WHERE 1=1';
    const params = [];

    if (species) {
      params.push(species);
      query += ` AND especie = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status_adoção = $${params.length}`;
    }

    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Erro ao buscar animais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para detalhes de um animal específico
app.get('/api/animals/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM animais WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animal não encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao buscar animal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar animal (apenas admin)
app.post('/api/animals', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    const { nome, especie, raca, idade, status_saude, data_entrada } = req.body;

    const result = await pool.query(
      `INSERT INTO animais (nome, especie, raca, idade, status_saude, data_entrada)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, especie, raca, idade, status_saude, data_entrada]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar animal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para solicitar adoção
app.post('/api/adoptions', authenticateToken, async (req, res) => {
  try {
    const { animal_id, adopter_message } = req.body;

    const result = await pool.query(
      `INSERT INTO adocoes (id_animal, id_adotante, observacoes_administrador)
       VALUES ($1, $2, $3) RETURNING *`,
      [animal_id, req.user.id, adopter_message]
    );

    res.status(201).json({
      id: result.rows[0].id,
      animal_id: result.rows[0].id_animal,
      adopter_id: result.rows[0].id_adotante,
      status: result.rows[0].status,
      request_date: result.rows[0].data_solicitacao,
      message: 'Solicitação de adoção enviada com sucesso. Aguarde a aprovação.'
    });

  } catch (error) {
    console.error('Erro ao solicitar adoção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar adoções (apenas admin)
app.get('/api/adoptions', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const result = await pool.query(`
      SELECT a.*, an.nome as animal_nome, u.nome as adotante_nome
      FROM adocoes a
      JOIN animais an ON a.id_animal = an.id
      JOIN usuarios u ON a.id_adotante = u.id
      ORDER BY a.data_solicitacao DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Erro ao buscar adoções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para registrar doação
app.post('/api/donations', authenticateToken, async (req, res) => {
  try {
    const { tipo, valor } = req.body;

    const result = await pool.query(
      `INSERT INTO doacoes (id_doador, tipo, valor)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, tipo, valor]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao registrar doação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor PawStation rodando na porta ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});