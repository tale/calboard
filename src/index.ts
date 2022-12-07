import { buildCalendar } from './calendar'

export type Environment = {
	storage: KVNamespace;
}

export default {
	async fetch(request: Request, environment: Environment) {
		try {
			return await handleRequest(request, environment)
		} catch {
			return new Response('Internal Server Error', {
				status: 500
			})
		}
	}
}

async function handleRequest(request: Request, environment: Environment) {
	const { pathname } = new URL(request.url)

	const keys = await environment.storage.list()

	for await (const key of keys.keys) {
		if (pathname === `/${key.name}.ics`) {
			const value = await environment.storage.get(key.name)

			if (!value) {
				throw new Error(`Failed to get value for key: ${key.name}`)
			}

			const calendar = await buildCalendar(value)
			return new Response(calendar, {
				headers: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					'Content-Type': 'text/calendar'
				}
			})
		}
	}

	return fetch('https://welcome.developers.workers.dev')
}
