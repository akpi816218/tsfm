# The project

```json
{
	"project": {
		"type": "cli-tool",
		"description": "A file manager (just like those found on modern operating systems), but with a text-based UI.",
		"allowedlangs": [
			"bash",
			"cplusplus",
			"javascript",
			"python",
			"typescript"
		],
		"requirements": [
			"Must include shortcuts for navigating through the filesystem.",
			"Must be cross-platform (supports UNIX-based and Windows)."
		],
		"rules": [
			"The program must compile to or be a singular file which can be run with a singular command.",
			"The program must be installable with the use of a singular command (one-liners ok). The use of commonly used package managers (such as vcpkg, npm, yarn, pnpm, and pip) is allowed.",
			"If a non-builtin library is used, a link to the documentation must be provided in a comment on the line above the import."
		]
	}
}
```
