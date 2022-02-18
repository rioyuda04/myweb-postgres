// import postgres pool
const {Pool} = require('pg')

// setup connection pool
const dbPool = new Pool({
    database: 'myweb',
    port: 5432,
    user: 'postgres',
    password: 'root'
})

// export db pool
module.exports = dbPool


