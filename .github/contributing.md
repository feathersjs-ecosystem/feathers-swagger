# Contributing to Feathers Ecosystem

Thank you for contributing to Feathers! :heart: :tada:

## Report a bug

Before creating an issue please make sure you have checked out the docs. You might want to also try searching Github. It's pretty likely someone has already asked a similar question.

If you haven't found your answer please feel free to join our [slack channel](http://slack.feathersjs.com), create an issue on Github, or post on [Stackoverflow](http://stackoverflow.com) using the `feathersjs` tag. We try our best to monitor Stackoverflow but you're likely to get more immediate responses in Slack and Github.

Issues can be reported in the [issue tracker](https://github.com/feathersjs-ecosystem/feathers-swagger/issues).

## Pull Requests

We :heart: pull requests and we're continually working to make it as easy as possible for people to contribute.

We prefer small pull requests with minimal code changes. The smaller they are the easier they are to review and merge. A FeathersJS maintainer will pick up your PR and review it as soon as they can. They may ask for changes or reject your pull request. This is not a reflection of you as an engineer or a person. Please accept feedback graciously as we will also try to be sensitive when providing it.

Although we generally accept many PRs they can be rejected for many reasons. We will be as transparent as possible but it may simply be that you do not have the same context, historical knowledge or information regarding the roadmap that the maintainers have. We value the time you take to put together any contributions so we pledge to always be respectful of that time and will try to be as open as possible so that you don't waste it. :smile:

**All PRs (except documentation) should be accompanied with tests and pass the linting rules. If needed updates to TypeScript types should be included.**

### Code style

Before running the tests from the `test/` folder `npm test` will run ESlint. You can check your code changes individually by running `npm run lint`.

### Tests

[Mocha](http://mochajs.org/) tests are located in the `test/` folder and can be run using the `npm run mocha` or `npm test` (with ESLint and code coverage) command.

### TypeScript types

As the TypeScript types are part of the repository they have to be updated with code changes. They are located in `types` and can be tested running `npm run dtslint` or `npm test`.

### Documentation

Updates to the documentation should be made in the README.md.

## Contributor Code of Conduct

As contributors and maintainers of this project, we pledge to respect all people who contribute through reporting issues, posting feature requests, updating documentation, submitting pull requests or patches, and other activities.

We are committed to making participation in this project a harassment-free experience for everyone, regardless of level of experience, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, or religion.

Examples of unacceptable behavior by participants include the use of sexual language or imagery, derogatory comments or personal attacks, trolling, public or private harassment, insults, or other unprofessional conduct.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct. Project maintainers who do not follow the Code of Conduct may be removed from the project team.

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by opening an issue or contacting one or more of the project maintainers.

This Code of Conduct is adapted from the [Contributor Covenant](http://contributor-covenant.org), version 1.0.0, available at [http://contributor-covenant.org/version/1/0/0/](http://contributor-covenant.org/version/1/0/0/)
