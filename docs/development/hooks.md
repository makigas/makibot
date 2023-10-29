---
layout: default
title: Hooks
nav_order: 1
parent: Desarrollo
---

1. Tabla de contenidos
   {:toc}

## ¿Qué es un hook?

Un hook es una clase que contiene cierta lógica que debe dispararse en momentos puntuales dentro del ciclo de vida del bot.

Por ejemplo, un hook puede contener lógica que debe dispararse cada vez que se recibe un mensaje nuevo, o una que deba dispararse cada vez que un miembro se una al servidor.

Discord tiene una API orientada a eventos. Cuando un bot inicia sesión, debe establecer comunicación mediante WebSocket con los servidores de Discord, para recibir información sobre cosas que pasen: que se envíe un menaje nuevo a un servidor, que un miembro se conecte a un canal de voz... la mayoría de frameworks para crear bots de Discord se basan en este sistema y ofrecen una API basada en eventos donde defines una función con el handler que quieres que se dispare cuando Discord te comunique que algo concreto ha pasado.

## ¿Qué llevó a Makibot a usar hooks?

Nuestro bot al principio también empezó así, por supuesto.

```js
client.on("message", (message) => {
  /* Comprobar si el mensaje tiene links y eliminarlo de ser así. */
  /* Comprobar si el mensaje se ha enviado al canal de captchas. */
  /* Saludar a la persona si es su primer mensaje enviado al servidor. */
});

client.on("messageReactionAdd", (react) => {
  /*
   * Eliminar el mensaje si la persona que reacciona
   * tiene rol de mod y el emoji es el cubo de basura.
   */
});
```

¿Cuál era el problema? Que al final teníamos unos event listeners llenos de código, que eran muy complicados de organizar. Además, como todo es asíncrono, el código estaba plagado de `.then()`s o de `await`s. Necesitamos una mejor forma de colocar el código para tenerlo organizado y fácil de modificar o extender.

## ¿Cómo funciona nuestra API de Hooks?

Un Hook es una interfaz que implementa una serie de métodos opcionales. Cualquier clase que implemente esta interfaz puede decidir si implementarlos o no, según si los va a necesitar.

```ts
interface Hook {
  onMessageCreate?: (message: Message) => Promise<void>;
  onGuildMemberJoin?: (member: GuildMember) => Promise<void>;
  onGuildMemberBan?: (ban: GuildBan) => Promise<void>;
}
```

Por ejemplo, si estamos programando un hook que debe validar cada mensaje entrante en busca de spam, la función que querremos implementar será la `onMessageCreate`.

```ts
class Antispam implements Hook {
  async onMessageCreate(message: Message): Promise<void> {
    if (sospechoso(message.content)) {
      await sancionar(message.member);
    }
  }
}
```

Si el hook sólo debe saludar a las nuevas incorporaciones, entonces lo que querremos implementar será la `onGuildMemberJoin`:

```ts
class Roster implements Hook {
  async onGuildMemberJoin(member: GuildMember): Promise<void> {
    const embed = fabricarNotificacion(member);
    await webhookRoster.nuevoMensaje(embed);
  }
}
```

Como se ve, esto es más manejable que tener todo el código en event listeners globales.

## ¿Cómo se disparan los hooks?

El HookManager (`src/lib/hooks.ts`) se instancia cuando se inicia el bot. Este HookManager instancia todas las clases exportadas por los módulos que hay en la carpeta `src/hooks` y los categoriza en función del tipo de hook que soporta. Si una clase define una función concreta, es que lo soporta.

El HookManager es el que se conecta con el cliente de Discord.js y está pendiente de los eventos. Cuando el HookManager recibe un evento (por ejemplo, un `"messageCreate"`), lo propaga a los distintos hooks que implementen esa función concreta. De este modo, cada hook puede definir su propia lógica y recibirá el evento cuando llegue.

Cada `Hook` debe definir, además, una propiedad llamada `name` que identifique ese hook. Principalmente se usa para depurar en el log los hooks que se disparan.

## ¿Cómo crear un hook?

Define un archivo en `src/hooks`. Este archivo debe exportar una clase que implemente la interfaz Hook. En su forma más básica, al menos hace falta definir el nombre.

```ts
import { Hook } from "../lib/hook";

export default class MyHook implements Hook {
  name = "example";
}
```

A partir de ahí, tienes libertad para implementar las funciones que haga falta en función de lo que deba hacer ese hook. Por ejemplo, si necesito que este hook ejecute lógica cuando se recibe un mensaje, implemento la función `onMessageCreate`:

```ts
import { Hook } from "../lib/hook";

export default class MyHook implements Hook {
  name = "example";

  async onMessageCreate(message: Message): Promise<void> {
    if (message.cleanContent === "!ping") {
      await message.reply("pong!");
    }
  }
}
```

## ¿Qué funciones puedo implementar en mi hook?

Esta es una lista de las funciones y los prototipos de referencia:

- `onMessageCreate(message)`: Se ejecuta cuando se recibe un mensaje nuevo, en un servidor o por mensaje privado. Recibe como parámetro el mensaje.
- `onPremoderateMessage(message)`: Se ejecuta cuando se recibe un mensaje nuevo antes de llamar a onMessageCreate, para aquellos servicios que lo implementen. Esta función debe devolver una promesa que resuelva a null si el mensaje es seguro. Si un servicio detecta que un mensaje debe ser moderado automáticamente (porque tiene spam), debe devolver directamente un payload ModEvent. Cuando una función devuelve un ModEvent, el mensaje se modera automáticamente y es eliminado, sin llamar a onMessageCreate.
- `onMessageUpdate(oldMessage, newMessage)`: Se ejecuta cuando se modifica un mensaje que el bot previamente haya podido ver. Recibe como parámetros el viejo mensaje y el nuevo mensaje. Por ejemplo, si ha cambiado de contenido, podrá comparar `oldMessage.cleanContent` con `newMessage.cleanContent`.
- `onmessageDestroy(message)`: Se ejecuta cuando se elimina un mensaje que el bot previamente haya recibido haya sido eliminado. **El mensaje es parcial**. No trates de hacer un `fetch()` porque la API te va a devolver HTTP 404.
- `onMessageReactionAdd(reaction, user)`: Se ejecuta cuando un usuario (`user`) reacciona (`reaction`) a un mensaje (`reaction.message`).
- `onMessageReactionDestroy(reaction, user)`: Se ejecuta cuando un usuario (`user`) elimina su reacción (`reaction`) de un mensaje (`reaction.message`).
- `onMessageReactionBulkDestroy(message)`: Se ejecuta cuando todas las reacciones de un mensaje (`message`) son eliminadas.
- `onGuildMemberJoin(member)`: Se ejecuta cuando un miembro se une al servidor.
- `onGuildMemberUpdate(prev, next)`: Se ejecuta cuando un miembro actualiza algo sobre ello. Depende mucho del evento que dispara la API de Discord. Te proporciona el estado anterior del usuario y el nuevo estado del usuario y ya es cosa tuya hacer el diff y detectar qué ha cambiado.
- `onGuildMemberLeave(member)`: Se ejecuta cuando un miembro abandona el servidor. El `member` podría ser parcial. Cuidado con hacer un `fetch()`, porque el evento se puede recibir en cuentas que se eliminan (por ejemplo, el usuario borra su cuenta de Discord, o se trata de una cuenta temporal que Discord borra). En ese caso, hacer un `fetch()` provocará un error HTTP 404 en la API de Discord.
- `onBuildMemberBan(ban)`: se ejecuta cuando un miembro es baneado. La información está disponible a través del objeto `ban`.
