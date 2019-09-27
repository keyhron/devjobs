const express = require('express');
const router = express.Router();
const {body} = require('express-validator')
// Controllers
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');

module.exports = () => {

  router.get('/', homeController.mostrarTrabajos);

  // Crear vacantes
  router.get('/vacantes/nueva', 
    authController.verificarUsuario,
    vacantesController.formularioNuevaVacante
  );
  router.post('/vacantes/nueva', 
    authController.verificarUsuario,
    body('titulo', 'Agrega un Título a la vacante').not().isEmpty().escape(),
    body('empresa', 'Agrega una Empresa').not().isEmpty().escape(),
    body('ubicacion', 'Agrega una Ubicación').not().isEmpty().escape(),
    body('salario').escape(),
    body('contrato', 'Selecciona el Tipo de Contrato').not().isEmpty().escape(),
    body('skills', 'Agrega al menos una habilidad').not().isEmpty().escape(),
    vacantesController.validarVacante,
    vacantesController.agregarVacante
  );

  // Mostrar Vacante (Singular)
  router.get('/vacantes/:url', vacantesController.mostrarVacante);

  // Editar Vacante
  router.get('/vacantes/editar/:url', 
    authController.verificarUsuario,
    vacantesController.formEditarVacante
  );
  router.post('/vacantes/editar/:url', 
    authController.verificarUsuario,
    body('titulo', 'Agrega un Título a la vacante').not().isEmpty().escape(),
    body('empresa', 'Agrega una Empresa').not().isEmpty().escape(),
    body('ubicacion', 'Agrega una Ubicación').not().isEmpty().escape(),
    body('salario').escape(),
    body('contrato', 'Selecciona el Tipo de Contrato').not().isEmpty().escape(),
    body('skills', 'Agrega al menos una habilidad').not().isEmpty().escape(),
    vacantesController.editarVacante
  );

  // Eliminar Vacantes
  router.delete('/vacantes/eliminar/:id',
    authController.verificarUsuario,
    vacantesController.eliminarVacante
  );

  // Crear cuenta
  router.get('/crear-cuenta', usuariosController.formCrearCuenta);
  router.post('/crear-cuenta', 
    body('nombre', "El nombre es obligatorio").not().isEmpty().escape(), 
    body('email', "El email debe ser válido").isEmail(),
    body('password', "El password es obligatorio").not().isEmpty().escape(),
    body('confirmar', "Confirmar password no puede ir vácio").not().isEmpty().escape(),
    body('confirmar').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('El password es diferente');
      }

      return true;
    }),
    usuariosController.validarRegistro,
    usuariosController.crearUsuario
  );

  // Autenticar Usuarios
  router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
  router.post('/iniciar-sesion', authController.autenticarUsuario);

  // Cerrar Sesión
  router.get('/cerrar-sesion',
    authController.verificarUsuario,
    authController.cerrarSesion
  );

  // Resetar Password (email)
  router.get('/reestablecer-password', 
    authController.formReestablecerPassword
  );
  router.post('/reestablecer-password', 
    authController.enviarToken
  );

  // Resetear Password (Nueva password)
  router.get('/reestablecer-password/:token',
    authController.reestablecerPassword
  );
  router.post('/reestablecer-password/:token',
    authController.guardarPassword
  );

  // Panel de administración
  router.get('/administracion', 
    authController.verificarUsuario,
    authController.mostrarPanel
  );

  // Editar Perfil
  router.get('/editar-perfil', 
    authController.verificarUsuario,
    usuariosController.formEditarPerfil
  );
  router.post('/editar-perfil', 
    authController.verificarUsuario,
    usuariosController.subirImagen,
    body('nombre', 'El nombre no puede ir vacío').not().isEmpty().escape(),
    body('email', 'El correo no puede ir vacío').not().isEmpty().escape(),
    body('password').escape(),
    usuariosController.editarPerfil
  );

  router.post('/vacantes/:url',
    authController.verificarUsuario,
    vacantesController.subirCV,
    vacantesController.contactar
  );

  // Muestra los candidatos por vacante
  router.get('/candidatos/:id',
    authController.verificarUsuario,
    vacantesController.mostrarCandidatos
  );

  // Buscador de vacantes
  router.post('/buscador', vacantesController.buscarVacantes);

  return router;
}