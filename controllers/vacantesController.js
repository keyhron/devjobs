const Vacante = require('../models/Vacantes');
const { validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante = (req, res) => {
  res.render('nueva-vacante', {
    nombrePagina: 'Nueva Vacante',
    tagline: 'Llena el formulario y publica tu vacante',
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
  })

}

// Agregar vacantes a la DB
exports.agregarVacante = async (req, res) => {
  
  const vacante = new Vacante(req.body);

  // Usuario creador de vacantes
  vacante.autor = req.user._id;

  // Crear arreglo de habilidades (skills)
  vacante.skills = req.body.skills.split(',');

  // Almacenarlo en la DB
  const nuevaVacante = await vacante.save();

  // Redireccionar
  res.redirect(`/vacantes/${nuevaVacante.url}`);
}

// Muestra una vacante
exports.mostrarVacante = async (req, res, next) => {

  const vacante = await Vacante.findOne({ url: req.params.url }).populate('autor')
  if(!vacante) return next();

  res.render('vacante', {
    vacante,
    nombrePagina: vacante.titulo,
    barra: true
  })
}

exports.formEditarVacante = async (req, res, next) => {

  const vacante = await Vacante.findOne({ url: req.params.url });
  if(!vacante) return next();

  res.render('editar-vacante', {
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre
  })

}

exports.editarVacante = async (req, res) => {
  
  // Si hay errores
  const errors = validationResult(req);
  if (errors.errors.length > 0) {
    // Recarga la vista con los errores
    req.flash('error', errors.errors.map(error => error.msg));
    res.render('nueva-vacante', {
      nombrePagina: 'Nueva Vacante',
      tagline: 'Llena el formulario y publica tu vacante',
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
      imagen: req.user.imagen
  });

    return;
  }
  // Si no hay errores
  const vacanteActualizada = req.body;
  vacanteActualizada.skills = req.body.skills.split(',');
  
  const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, vacanteActualizada, {
    new: true,
    runValidators: true
  });
  
  res.redirect(`/vacantes/${vacante.url}`);
}

// Validar y sanitizar las nuevas vacantes
exports.validarVacante = (req, res, next) => {
  // Si hay errores
  const errors = validationResult(req);
  if (errors.errors.length > 0) {
    // Recarga la vista con los errores
    req.flash('error', errors.errors.map(error => error.msg));
    res.render('nueva-vacante', {
      nombrePagina: 'Nueva Vacante',
      tagline: 'Llena el formulario y publica tu vacante',
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
      imagen: req.user.imagen
    });

    return;
  }

  // Si no hay errores
  next();
}

exports.eliminarVacante = async (req, res) => {
  const {id} = req.params;
  const vacante = await Vacante.findById(id);
  
  if(verificarAutor(vacante, req.user)) {
    // Todo bien, sí es el usuario, eliminar
    vacante.remove();
    res.status(200).send('La vacante se eliminó correctamente');

  } else {
    // No es el usuario, no permitido
    res.status(403).send('Error');
  }
}

const verificarAutor = (vacante = {}, usuario = {}) => {
  if(!vacante.autor.equals(usuario._id)) {
    return false;
  }

  return true;
}

// Subir archivos en PDF
exports.subirCV = (req, res, next) => {
  upload(req, res, function(error) {
    if(error) {
      if(error instanceof multer.MulterError) {
        if(error.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'El archivo es muy grande: Máximo 120kb');
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
  limits: {fileSize: 200000},
  storage: fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + '../../public/uploads/cv')
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split('/')[1];
      cb(null, `${shortid.generate()}.${extension}`);
    }
  }),
  fileFilter(req, file, cb) {
    if(file.mimetype === 'application/pdf') {
      // Se ejecutan dos piezas, el callback como true o false - true: cuando la imagen se acepta
      cb(null, true);
    } else {
      cb(new Error('Formato no válido'), false);
    }
  }
}

const upload = multer(configuracionMulter).single('cv');

// almacenar los candidatos a la DB
exports.contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({url: req.params.url});

  // Si no existe la vacante
  if(!vacante) {
    return next();
  }

  // Todo bien
  const nuevoCandidato = {
    nombre: req.body.nombre,
    email: req.body.email,
    cv: req.file.filename
  }

  // Almacenar la vacante
  vacante.candidatos.push(nuevoCandidato);

  await vacante.save();

  // Mensaje flash y redireccionar
  req.flash('correcto', 'Se envío tu currículum correctamente');
  res.redirect('/');
}

exports.mostrarCandidatos = async (req, res, next) => {

  const vacante = await Vacante.findById(req.params.id);

  if(vacante.autor != req.user._id.toString()) {
    return next();
  } 
  
  if(!vacante) return next();

  res.render('candidatos', {
    nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos
  })
}

// Buscador de vacantes
exports.buscarVacantes = async (req, res) => {

  const vacantes = await Vacante.find({
    $text: {
      $search: req.body.q
    }
  });

  // Mostrar las vacantes
  res.render('home', {
    nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
    barra: true,
    vacantes
  })

}
