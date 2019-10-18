const Usuarios = require('../models/Usuarios');
const { validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

// Multer
exports.subirImagen = (req, res, next) => {
  upload(req, res, function(error) {
    if(error) {
      if(error instanceof multer.MulterError) {
        if(error.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'El archivo es muy grande: Máximo 100kb');
        } else {
          req.flash('error', error.message)
        }
      } else {
        req.flash('error', error.message);
      }
      res.redirect('back');
      return;
    } else {
      next()
    }
  })
}

// Opciones de Multer
const configuracionMulter = {
  limits: {fileSize: 100000},
  storage: fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + '/../public/uploads/perfiles')
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split('/')[1];
      cb(null, `${shortid.generate()}.${extension}`);
    }
  }),
  fileFilter(req, file, cb) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      // Se ejecutan dos piezas, el callback como true o false - true: cuando la imagen se acepta
      cb(null, true);
    } else {
      cb(new Error('Formato no válido'), false);
    }
  }
}

const upload = multer(configuracionMulter).single('imagen');

// Crear Cuenta
exports.formCrearCuenta = (req, res) => {
  res.render('crear-cuenta', {
    nombrePagina: 'Crea tu cuenta en DevJobs',
    tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
  })
}

exports.validarRegistro = (req, res, next) => {

  // Si hay errores
  const errors = validationResult(req);
  if (errors.errors.length > 0) {
    req.flash('error', errors.errors.map(error => error.msg));
    res.render('crear-cuenta', {
      nombrePagina: 'Crea tu cuenta en DevJobs',
      tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
      mensajes: req.flash()
    });

    return;
  }

  // Si no hay errores
  next();
}

exports.crearUsuario = async (req, res, next) => {
  // Crear el usuario
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();    
    res.redirect('/iniciar-sesion');
  } catch (error) {
    req.flash('error', error);
    res.redirect('/crear-cuenta');
  }
}

// Formulario para iniciar sesión
exports.formIniciarSesion = (req, res) => {
  res.render('iniciar-sesion', {
    nombrePagina: 'Iniciar Sesión devJobs'
  })
}

// Form editar perfil
exports.formEditarPerfil = (req, res) => {
  res.render('editar-perfil', {
    nombrePagina: 'Edita tu perfil en devJobs',
    usuario: req.user,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  })
}

// Guardar Cambios - Editar Perfil
exports.editarPerfil = async (req, res) => {

  // Si hay errores
  const errors = validationResult(req);
  if (errors.errors.length > 0) {
    req.flash('error', errors.errors.map(error => error.msg));
    res.render('editar-perfil', {
      nombrePagina: 'Edita tu perfil en devJobs',
      usuario: req.user,
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
      imagen: req.user.imagen
    })

    return;
  }

  // Si no hay errores
  const usuario = await Usuarios.findById(req.user._id);
  
  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;
  if(req.body.password) {
    usuario.password = req.body.password;
  }

  // Si hay imagen anterior y nueva, significa que vamos a borrar la anterior
  if(req.file && usuario.imagen) {
    const imagenAnterior = __dirname + `/../public/uploads/grupos/${usuario.imagen}`;

    // Eliminar archivo con fileSystem
    fs.unlink(imagenAnterior, (error) => {
      if(error) {
        console.log(error);
      }
      return;
    })
  }

  // Multer - Agregar nueva imagen
  if(req.file) {
    usuario.imagen = req.file.filename;
  }

  await usuario.save();

  req.flash('correcto', 'Cambios guardados correctamente')
  // Redireccionar
  res.redirect('/administracion');
}
