const passport = require('passport');
const Vacante = require('../models/Vacantes');
const Usuarios = require('../models/Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
  successRedirect: '/administracion',
  failureRedirect: '/iniciar-sesion',
  failureFlash: true,
  badRequestMessage: 'Ambos campos son obligatorios'
})

// Revisar si el usuario está autenticado o no
exports.verificarUsuario = (req, res, next) => {
  
  // Revisar el usuario
  if(req.isAuthenticated()) {
    return next(); // Autenticado
  }

  // Redireccionar - No autenticado
  res.redirect('/iniciar-sesion');
}

exports.mostrarPanel = async (req, res) => {
  // Consultar el usuario autenticado
  const vacantes = await Vacante.find({autor: req.user._id});

  res.render('administracion', {
    nombrePagina: 'Panel de Administración',
    tagline: 'Crea y administra tus vacantes desde aquí',
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes
  })
}

exports.cerrarSesion = (req, res) => {
  req.logout();

  req.flash('correcto', 'Cerraste sesión correctamente');
  return res.redirect('/iniciar-sesion');
}

// Formulario para reestablecer el password
exports.formReestablecerPassword = (req, res) => {
  res.render('reestablecer-password', {
    nombrePagina: 'Reestablece Tu Password',
    tagline: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email.'
  })
}

// Genera el token en la tabla de usuarios
exports.enviarToken = async (req, res) => {
  const usuario = await Usuarios.findOne({email: req.body.email});

  if(!usuario) {
    req.flash('error', 'No existe esa cuenta');
    return res.redirect('/iniciar-sesion');
  }

  // El usuario existe, generar token
  usuario.token = crypto.randomBytes(20).toString('hex');
  usuario.expira = Date.now() + 3600000;

  // Guardar el usuario
  await usuario.save();
  const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

  // Enviar Token por email
  await enviarEmail.enviar({
    usuario,
    subject: 'Password Reset',
    resetUrl,
    archivo: 'reset'
  })

  req.flash('correcto', 'Revisa tu email para las indicaciones');
  res.redirect('/iniciar-sesion');
}

// Validar Token y Usuario - Mostrar Vista
exports.reestablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now()
    }
  });

  if(!usuario) {
    req.flash('error', 'El formulario no es válido, intenta de nuevo');
    return res.redirect('/reestablecer-password');
  }

  // Todo bien - mostrar el formulario
  res.render('nuevo-password', {
    nombrePagina: 'Nuevo Password'
  })
}

// Almacena el nuevo password en la base de datos
exports.guardarPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now()
    }
  });

  if(!usuario) {
    req.flash('error', 'El formulario no es válido, intenta de nuevo');
    return res.redirect('/reestablecer-password');
  }

  console.log(req.body.password);
  console.log(usuario)
  // Asignar valores
  usuario.password = req.body.password;
  usuario.token = undefined;
  usuario.expira = undefined;

  // Guardar en la DB
  await usuario.save();

  console.log(usuario)
  // Redirigir
  req.flash('correcto', 'Password modificado correctamente');
  res.redirect('/iniciar-sesion');
}