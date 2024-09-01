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
