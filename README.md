# tsfm

A light, colorful TUI file manager written in TypeScript, with a focus on speed and ease of use. Integrated with feces-cli using [`@feces-cli/internals`](https://npmjs.com/package/@feces-cli/internals) to enable quick file trashing.

`tsfm` is a project conscious of users who prefer colorless output, and conforms to [the NO\_COLOR standard](https://no-color.org). Users can export the environment variable `NO_COLOR` to their shell with any value except an empty string to suppress colored output in compatible programs. If this is present, `tsfm` will simply not output color, resulting in a colorless interface. The user may, at any time, supply either `--color` or `--no-color` to override the environment setting.

## Installation

To install tsfm, run the following command:

```bash
npm i -g tsfm
```

## Usage

To use tsfm, simply run `tsfm`.

```bash
tsfm [directory] [--color | --no-color]
```

For help, run `tsfm help` or press `/` or `?` while in the program.

## Contributing

Contributions are welcome! ~~Please read the [contributing guidelines](CONTRIBUTING.md) before submitting a pull request.~~ I still have to add contributing guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [Akhil Pillai](https://github.com/akpi816218) - author
- [blessed](https://github.com/chjj/blessed) - TUI library
- [cli-highlight](https://github.com/felixfbecker/cli-highlight) - syntax highlighting
- [@feces-cli/internals](https://github.com/feces-cli/internals) - file trashing

This README was generated in part by GitHub Copilot Chat - thank you!
