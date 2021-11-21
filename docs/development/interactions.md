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
* Los menús contextuales van en `src/interactions/menus`.
* Los botones van en `src/interactions/buttons`.
* Los menús de selección van en `src/interactions/selects`.

Dentro de cada archivo hay que exportar una clase que debe extender a alguna de las cuatro clases superiores:

* Los comandos se procesan con clases que extienden `CommandInteractionHandler`.
* Los menús contextuales se procesan con clases que extienden `ContextMenuInteractionHandler`.
* Los botones se procesan con clases que extienden `ButtonInteractionHandler`.
* Los menús de selección se procesan con clases que extienden `SelectMenuInteractionHandler`.

Estas interfaces están definidas en `src/lib/interactions`, y como se ve, implementan todas una función llamada `handle`. La diferencia está en el primer parámetro, que siempre será la propia interacción recibida, pero que en cada caso será del tipo que corresponda:

```ts
export interface CommandInteractionHandler extends BaseInteractionHandler {
  handle(event: CommandInteraction): Promise<void>;
}

export interface ContextMenuInteractionHandler extends BaseInteractionHandler {
  handle(event: ContextMenuInteraction): Promise<void>;
}

export interface ButtonInteractionHandler extends BaseInteractionHandler {
  handle(event: ButtonInteraction): Promise<void>;
}

export interface SelectMenuInteractionHandler extends BaseInteractionHandler {
  handle(event: SelectMenuInteraction): Promise<void>;
}
```