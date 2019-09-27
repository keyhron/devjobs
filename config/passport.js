const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const moongose = require('mongoose');
const Usuarios = moongose.model('Usuarios');

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
  }, async (email, password, done) => {
      const usuario = await Usuarios.findOne({email});

      if(!usuario) return done(null, false, {
        message: 'Usuario No Existente'
      });

      // El usuario existe - verificar password
      const verificarPassword = usuario.compararPassword(password);
      if(!verificarPassword) return done(null, false, {
        message: 'Password Incorrecto'
      })

      // Todo bien
      return done(null, usuario);
}));

passport.serializeUser((usuario, done) => done(null, usuario._id));

passport.deserializeUser(async (id, done) => {
  const usuario = await Usuarios.findById(id).exec();
  return done(null, usuario);
});

module.exports = passport;