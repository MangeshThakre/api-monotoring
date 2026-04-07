// global level configuration for the app

export default { 
    mongoDbUrl: process.env.MONGO_DB_URL || 'mongodb://localhost:27017/notes-app',
    port: process.env.PORT || 3000  ,
    postgrasDbUrl: process.env.POSTGRES_DB_URL || 'postgresql://localhost:5432/notes-app'
}