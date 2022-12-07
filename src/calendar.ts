export async function buildCalendar(url: string) {
	const rawData = await fetchCalendar(url)
	const events = parseCalendarEvents(rawData)
	const rawPayloads = new Array<string>()

	for (const { time: rawTime, stamp, uid, summary } of events) {
		const [timeZone, timeStamp] = rawTime.split(':')
		const [date, time] = timeStamp.split('T')
		const regexTime = time.match(/.{1,2}/g)

		if (!regexTime) {
			throw new Error(`Failed to parse time: ${rawTime}`)
		}

		let [hour, minute, second] = regexTime

		// Round up the time by 1 minute
		if (minute === '59') {
			minute = '00'
			hour = String(Number(hour) + 1)
		}

		const reminderHour = String(Number(hour) - 1)
		const start = `DTSTART;${timeZone}:${date}T${reminderHour}${minute}${second}`
		const end = `DTEND;${timeZone}:${date}T${hour}${minute}${second}`

		rawPayloads.push([
			'BEGIN:VEVENT',
			`DTSTAMP:${stamp}`,
			`UID:${uid}`,
			`SUMMARY:${summary}`,
			start,
			end,
			'END:VEVENT'
		].join('\n'))
	}

	const beforeEventsData = rawData.slice(0, rawData.indexOf('BEGIN:VEVENT'))
	return `${beforeEventsData}\n${rawPayloads.join('\n')}\nEND:VCALENDAR`
}

async function fetchCalendar(url: string) {
	const response = await fetch(url, {
		headers: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'User-Agent': 'Calboard/1.0 (Tale)'
		}
	})

	if (response.status !== 200) {
		throw new Error(`Failed to fetch calendar: ${response.status}`)
	}

	return response.text()
}

type CalendarEvent = {
	stamp: string;
	uid: string;
	time: string;
	summary: string;
}

function parseCalendarEvents(rawData: string) {
	const events = new Array<CalendarEvent>()

	let handlingEvent = false
	let currentEventIndex = 0

	for (const rawLine of rawData.split('\n')) {
		const line = rawLine.trim()

		// Represents the start of a calendar event
		if (line === 'BEGIN:VEVENT') {
			// Push a blank event that will be filled in later
			const eventsLength = events.push({
				stamp: '',
				uid: '',
				time: '',
				summary: ''
			})

			// .push() gives the length and the index is always 1 less
			currentEventIndex = eventsLength - 1
			handlingEvent = true
			continue
		}

		// Represents the end of a calendar event
		if (line === 'END:VEVENT') {
			handlingEvent = false
			continue
		}

		// Only fired if the line pertains to a VEVENT
		if (!handlingEvent) {
			continue
		}

		// Calendar directive prefix
		const prefix = line.slice(0, getPrefixEndIndex(line))

		if (prefix === 'DTSTAMP') { // Event creation date stamp
			events[currentEventIndex].stamp = getSuffix(line, prefix)
			continue
		}

		if (prefix === 'UID') { // Unique ID
			events[currentEventIndex].uid = getSuffix(line, prefix)
			continue
		}

		if (prefix === 'SUMMARY') { // Event summary
			events[currentEventIndex].summary = getSuffix(line, prefix)
			continue
		}

		if (prefix === 'DTEND') { // Event end time/due date
			events[currentEventIndex].time = getSuffix(line, prefix)
			continue
		}
	}

	return events
}

// Same as .indexOf() but for multiple characters
function getPrefixEndIndex(prefix: string) {
	for (const char of prefix) {
		if (char === ';' || char === ':') {
			return prefix.indexOf(char)
		}
	}

	return -1
}

// Gets the suffix of a line after the prefix
function getSuffix(line: string, prefix: string) {
	return line.slice(prefix.length + 1)
}
