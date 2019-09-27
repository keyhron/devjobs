import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
  const skills = document.querySelector('.lista-conocimientos');

  // Limpiar las alertas
  let alertas = document.querySelector('.alertas');

  if(alertas) {
    limpiarAlertas();
  }

  if(skills) {
    skills.addEventListener('click', agregarSkills);

    // Una vez que estamos en editar, llamar la función
    skillsSeleccionos();
  }

  const vacantesListado = document.querySelector('.panel-administracion');

  if(vacantesListado){
    vacantesListado.addEventListener('click', accionesListado)
  }

})

const skills = new Set();

const agregarSkills = (e) => {  
  if(e.target.tagName === "LI") {
    if(e.target.classList.contains('activo')) {
      // Quitar el set y la clase
      skills.delete(e.target.textContent);
      e.target.classList.remove('activo');
    } else {
      // Agregar el set y la clase
      skills.add(e.target.textContent);
      e.target.classList.add('activo');
    }
  } 
  
  const skillsArray = [...skills];
  document.querySelector('#skills').value = skillsArray;

}

const skillsSeleccionos = () => {
  const seleccionadas = Array.from(document.querySelectorAll('.lista-conocimientos .activo'));

  seleccionadas.forEach(seleccionada => {
    skills.add(seleccionada.textContent);
  })

  // Inyectarlo en el hidden
  const skillsArray = [...skills];
  document.querySelector('#skills').value = skillsArray; 
}

const limpiarAlertas = () => {
  const alertas = document.querySelector('.alertas');
  const interval = setInterval(() => {
    if(alertas.children.length > 0) {
      alertas.removeChild(alertas.children[0]);
    } else if (alertas.children.length === 0) {
      alertas.parentElement.removeChild(alertas);
      clearInterval(interval);
    }
  }, 2000 );
}

// Eliminar vacantes
const accionesListado = e => {
  e.preventDefault();

  if(e.target.dataset.eliminar) {
    // Eliminar con axios
    Swal.fire({
      title: '¿Estás segura de eliminar la vacante?',
      text: "Una vez eliminada, no se puede recuperar",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, Cancelar'
    }).then((result) => {
      if (result.value) {
        // Enviar petición con axios
        const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;

        // Axios para eliminar vacante
        axios.delete(url, {params: url})
          .then(function(respuesta) {
              if(respuesta.status === 200) {
              Swal.fire(
                'Vacante Eliminada',
                respuesta.data,
                'success'
              );

              // Eliminar del DOM
              e.target.parentElement.parentElement.parentElement.removeChild( e.target.parentElement.parentElement);
            }
          })
          .catch(() => {
            Swal.fire({
              type: 'error',
              title: '¡Error!',
              text: 'No se pudo eliminar'
            })
          })
      }
    })
  } else if(e.target.tagName === 'A') {
    window.location.href = e.target.href;
  }
}