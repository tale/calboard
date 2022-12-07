# calboard
*A very basic microservice that fixes Blackboard calendars.*

> I only open-sourced this project to show it off. Only my girlfriend and I use this so the code is pretty inflexible.
> If you want to deploy this, you'll need to follow the [Deployment](#deployment) section, the current values in `wrangler.toml` are wrong.

## Justification
Pretty much every student will have heard about Blackboard (or maybe Canvas). It's the LMS that many universities use to as their learning platform and students both love and hate it. It does have this one neat feature where it can give you a calendar URL which you can subscribe to so that assignments and deadlines show up in your feed. However, this calendar does not bode well for certain apps like `Calendar.app` on `macOS` or `iOS`.

With that, I implemented the following changes when parsing the calendar subscription:
- Rounds up 59th minute events (It's common for deadlines to be 11:59 instead of 12:00)
- Sets the starting time of the event 1 hour back to compensate for spacing issues

## Deployment
Because I'm lazy, this is a Cloudflare Worker and needs to be deployed using `wrangler`. For more information on that, refer to the [documentation](https://developers.cloudflare.com/workers/) supplied by Cloudflare. Additionally, you'll need to bind a Workers KV instance to the worker in `wrangler.toml` and the application will create routes as follows. Each route will be advertised as `/{key}.ics` and will return the fixed version of the calendar supplied by the `value` of that key.

> Copyright (c) 2022 Aarnav Tale.
