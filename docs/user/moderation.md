---
layout: default
title: Moderación
nav_order: 1
parent: Manual de uso
---

1. Tabla de contenidos
   {:toc}

# Moderación

Idealmente todos deberíamos saber comportarnos en sociedad y deberíamos leer las reglas al entrar en un servidor de Discord. Pero esto es internet, así que no está de más contar con un sistema que ayude a gestionar rápidamente a las cuentas que incumplan alguna regla, o echar rápidamente a aquellas que pongan en peligro al resto de la comunidad.

Un **moderador** es una persona que tiene capacidad de organizar los mensajes de una conversación y las personas que participan en ella. Por ejemplo, pueden borrar mensajes, pueden cambiar los roles de otras personas, y fundamentalmente son personas de respeto debido a que tienen el poder de amonestar a otras personas por su mal comportamiento.

## Eventos de moderación

Makibot se puede ocupar de aplicar eventos de moderación. Un evento de moderación es una circunstancia en la cual Makibot gestiona los permisos de otra persona para interactuar con el servidor, por ejemplo, limitando su capacidad de enviar mensajes o echando a esa persona del servidor.

En este momento existen los siguientes tipos de eventos de moderación:

- <img src="/makibot/images/wastebasket.png" style="height: 1em;" alt=""> **Eliminación**: cuando el Makibot debe eliminar automáticamente un mensaje, por ejemplo, porque contenga un enlace inapropiado o porque no siga las normas. Sin embargo, no tiene ningún efecto real, y su aparición en el mod-log ocurre únicamente a modo informativo para todo el mundo.
- <img src="/makibot/images/warning.png" style="height: 1em;" alt=""> **Advertencia** (warn): sirve como llamada de atención general, por ejemplo, para los casos en los que una cuenta incumpla una norma de forma severa o reiterada (por ejemplo, si se le pide varias veces que no haga algo inapropiado como mandar enlaces a sitios no permitidos, abusar de las reacciones, emojis, o mayúsculas). Le aplica un rol que podría limitar sus funciones en algunos canales.
- <img src="/makibot/images/checkbox.png" style="height: 1em;" alt=""> **Un-warn**: elimina los efectos de una advertencia. Normalmente se dispara automáticamente cuando expira un warn.
- <img src="/makibot/images/mute.png" style="height: 1em;" alt=""> **Silenciar** (mute): impide que esa persona pueda hablar en los canales. Se suele usar cuando una cuenta representa un peligro inminente por los mensajes que está enviando y se la quiere cuarentenar.
- <img src="/makibot/images/speaker.png" style="height: 1em;" alt=""> **Des-silenciar** (unmute): elimina los efectos de un silencio. Normalmente se dispara automáticamente cuando expira un mute.
- <img src="/makibot/images/shoe.png" style="height: 1em;" alt=""> **Patada** (kick): echa a esa persona del servidor. Se puede volver a incorporar siguiendo un enlace de invitación o buscando el servidor en la página de comunidades.
- <img src="/makibot/images/hammer.png" style="height: 1em;" alt=""> **Expulsión** (ban): echa de forma irrevocable a esa persona del servidor. Intentar seguir un enlace para unirse resultará en un error.

## Mod-log

El mod-log es un canal donde queda registro de los eventos de moderación según se van aplicando.

El **modlog público** es un canal de solo lectura público en el que cuando se dispara por parte del Makibot una alerta de moderación, se envía automáticamente un mensaje con el caso de referencia, la razón del evento, y también una mención a la persona cuya cuenta está afectada. Se trata de una mención para facilitar así poder tomar nota del ID.

<figure>
<img src="/makibot/images/public-modlog.png" alt="Evento de moderación">
<figcaption>Un evento de moderación enviado a un canal público.</figcaption>
</figure>

El **modlog privado** es un canal accesible únicamente a miembros del grupo de moderación que muestra un reporte más detallado de las alertas que se producen. Por ejemplo, incluye identificadores más extensos de los mensajes, usuarios y canales en los que se produce un evento. En algunos casos, también incluye el propio contenido del mensaje eliminado.

<figure>
<img src="/makibot/images/private-modlog.png" alt="Evento de moderación">
<figcaption>Un evento de moderación enviado a un canal privado.</figcaption>
</figure>

## Cómo moderar

Existen dos interfaces principales para moderar.

La forma rápida es moderar directamente usando el comando `/mod`. Tiene la ventaja de que se puede buscar rápidamente la persona usando el autocompletado. Este comando tiene varios subcomandos según la acción a usar. Para moderar, se usaría lo siguiente:

- `/mod warn {cuenta} [razon] [duracion]`: aplica un warn.
  - cuenta: la cuenta a la que se aplica la llamada de atención.
  - razón (opcional): el motivo por el que se llama la atención.
  - duración (opcional): hora, día o semana, indica la duración.
- `/mod unwarn {cuenta}`: expira un warn antes de tiempo.
- `/mod mute {cuenta} [razon] [duracion]`: aplica un mute.
  - cuenta: la cuenta a la que se aplica el silencio.
  - razón (opcional): el motivo por el que se silencia.
  - duración (opcional): hora, día o semana, indica la duración.
- `/mod unmute {cuenta}`: expira un mute.
- `/mod kick {cuenta} [razon] [duracion]`: echa del servidor.
  - cuenta: la cuenta a la que se echa.
  - razón (opcional): el motivo por el que echa.
- `/mod ban {cuenta} [razon] [duracion]`: banea del servidor.
  - cuenta: la cuenta a la que se banea.
  - razón (opcional): el motivo por el que se banea.

La otra forma es utilizar el clic derecho sobre un mensaje y seleccionar la opción de moderar desde el menú de Aplicaciones. Con esto, se tiene acceso a un sistema interactivo donde se puede elegir desde los menús algunas razones prefijadas y también el castigo a aplicar, en la misma línea que los que se podrían aplicar desde el comando `/mod`. También se puede decidir si borrar o no un mensaje de forma rápida.

<figure>
<img src="/makibot/images/modreport.png" alt="Formulario de moderación">
<figcaption>Formulario para moderar interactivamente.</figcaption>
</figure>
