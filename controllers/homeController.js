const Vacante = require('../models/Vacantes');

exports.mostrarTrabajos = async (req, res, next) => {
  
  const vacantes = await Vacante.find();

  if(!vacantes) return next();
  
  res.render('home', {
    nombrePagina: 'devJobs',
    tagline: 'Encuentra y publica trabajo para Desarrolladores Web',
    barra: true,
    boton: true,
    vacantes
  })
}