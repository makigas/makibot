---
layout: default
title: Interactions
nav_order: 2
parent: Desarrollo
---

1. Tabla de contenidos
{:toc}

## Cómo funcionan las interacciones

Las interacciones es el sistema que Discord desea que los bots usen para comportarse en servidores de aquí a futuro.

Existen en este momento cuatro tipo de interacciones. Cada tipo de interacción se dispara de una forma concreta, pero en todos los casos se traduce en un evento que recibe la aplicación, con toda la información referente a esa interacción (quién la realizó y dónde, el tipo de interacción concreta que se ha disparado, y posibles parámetros que puede tener ese tipo de interacción). Los cuatro tipos de interacción que hay ahora mismo son:

* Comandos: un usuario dispara una interacción de este tipo escribiendo un barra-comando en el chat.
* Menús contextuales: se disparan haciendo clic derecho sobre un mensaje o un guild member y ejecutando una opción desde el menú.
* Botones: se disparan pulsando un botón.
* Menús de selección: se disparan desplegando un menú de selección en un mensaje y realizando una selección.

## Cómo funcionan las interacciones en Makibot

Como todas las interacciones se gestionan en Discord.js desde el mismo evento, y viendo los antecedentes que hay en el sistema hook, desde el primer momento las interacciones en Makibot están concebidas como clases independientes que implementan una lógica de negocio y que se identifican de algún modo.

Un manager (InteractionManager) se ocupará de recibir de forma global todas las interacciones y despacharlas, enviándolas a la clase concreta que corresponda en cada caso.

Para crear una interacción, hay que depositar en alguna de las subcarpetas del directorio `src/interactions` un archivo que exporte una clase. En función del tipo de interacción que se vaya a definir, hay que dejarla en una subcarpeta u otra:

* Los comandos van en `src/interactions/commands`.
* Los menús contextuales de usuario van en `src/interactions/usermenus`.
* Los menús contextuales de mensaje van en `src/interactions/messagemenus`.
* Los botones van en `src/interactions/buttons`.

Dentro de cada archivo hay que exportar una clase que debe extender a alguna de las cuatro clases superiores:

* Los comandos se procesan con clases que extienden `CommandInteractionHandler`.
* Los menús contextuales de usuario se procesan con clases que extienden `UserContextMenuInteractionHandler`.
* Los menús contextuales de mensaje se procesan con clases que extienden `MessageContextMenuInteractionHandler`.
* Los botones se procesan con clases que extienden `ButtonInteractionHandler`.

Estas interfaces están definidas en `src/lib/interactions`. Cada una de estas interfaces tiene dos funciones: `handleDM` y `handleGuild`. Cada una de estas funciones será invocada en un contexto diferente. Cuando el bot recibe una interacción dentro de una guild, buscará la función `handleGuild`. Cuando el bot recibe una interacción fuera de una guild, buscará la función `handleDM`.

Las funciones son opcionales y cada handler es libre de implementar la función si quiere o no. Lo que significa que un handler puede implementar cero, una o dos funciones. Cuando un handler no implementa una función, el bot asume que el handler no se puede usar en el contexto proporcionado y lanza un error automáticamente. Por ejemplo, si un command handler no implementa la función handleDM, el bot asumirá que no se puede usar en un DM, de modo que si alguien le lanza el comando mediante DM al bot, responderá con un mensaje de error automáticamente.

En cuanto a las funciones `handleGuild` y `handleDM`, se diferencian principalmente en el tipo de parámetro, que dependerá del tipo de interacción a tratar. Los handlers de interacciones de tipo botón recibirán un ButtonInteraction; los de comando recibirán un CommandInteraction.

## Interacciones avanzadas con colectores

Algunas interacciones presentan flujos complejos donde la respuesta de la interacción es interactiva.

* En el comando /roles, se puede modificar la lista de roles del desplegable que se muestra.
* En el comando /karma, se puede obtener más información pulsando los botones.
* Con la opción de menú Reportar, se puede rellenar todo un formulario con un reporte.

Antes, estos elementos asociados a la interacción original se gestionaban de una manera mucho más complicada: cada botón y cada select tenía su propia interacción asociada, y mediante un sistema de persistencia se almacenaba el identificador de la interacción original para poder persistir un estado que compartir entre interacciones.

Sin embargo, [Discord.js 13 tiene colectores](https://discordjs.guide/popular-topics/collectors.html#interaction-collectors), que es una clase que permite crear oyentes de interacción ad-hoc. Con esto, cada vez que se inicia una interacción que va a requerir más interactividad (por ejemplo, las descritas), se crea un listener específico para escuchar más interacciones de alguno de los tipos como "Pulsar botón Enviar en el reporte de error" o "Actualizar los roles en el desplegable de roles", que se ocupa de la lógica adicional.

La principal ventaja de este sistema es que esa lógica la podemos meter, ya no sólo en el mismo InteractionHandler que la de la interacción principal, sino que a menudo también la vamos a poder meter en una closure dentro del propio handler, para crear un listener por cada acción, que nos permitirá simplificar mucho la lógica, porque tenemos acceso a todos los identificadores de la interacción principal.