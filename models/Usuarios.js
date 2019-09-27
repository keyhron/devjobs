const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const bcrypt = require('bcrypt');

const usuariosSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  token: String,
  expira: Date,
  imagen: String

})
usuariosSchema.pre('save', async function(next) {
  // Si el password ya esta hasheado
  if(!this.isModified('password')) {
    return next();
  }

  // Si no lo está
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  next();
});

// Envia alerta cuando un usuario ya está registrado
usuariosSchema.post('save', function(error, doc, next) {
  if(error.name === 'MongoError' && error.code === 11000) {
    next('Ese correo ya está registrado');
  } else {
    next(error);
    
  }
})

// Autenticar Usuarios
usuariosSchema.methods = {
  compararPassword: function(password) {
    return bcrypt.compareSync(password, this.password);
  }
}

module.exports = mongoose.model('Usuarios', usuariosSchema);