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
	const filteredKeys = keys.keys.filter(key => !key.name.endsWith('_bypasses'))

	for await (const key of filteredKeys) {
		if (pathname === `/${key.name}.ics`) {
			const value = await environment.storage.get(key.name)
			const bypassKey = await environment.storage.get(`${key.name}_bypasses`)
			const bypasses = bypassKey ? bypassKey.split(',') : []

			if (!value) {
				throw new Error(`Failed to get value for key: ${key.name}`)
			}

			const calendar = await buildCalendar(value, bypasses)
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
