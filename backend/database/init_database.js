const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
    console.log('🧪 Testando conexão com o banco...');
    
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        console.log('✅ Conexão com PostgreSQL bem-sucedida!');
        
        // Testar consulta simples
        const result = await client.query('SELECT COUNT(*) as total FROM usuarios');
        console.log(`📊 Total de usuários: ${result.rows[0].total}`);
        
        await client.end();
        console.log('🎉 Banco de dados configurado e funcionando!');
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        console.log('\n🔧 Verifique:');
        console.log('1. Database "pawstation" existe no pgAdmin');
        console.log('2. Tabelas foram criadas via Query Tool');
        console.log('3. Credenciais no arquivo .env estão corretas');
    }
}

testConnection();