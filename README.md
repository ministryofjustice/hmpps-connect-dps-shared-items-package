# hmpps-connect-dps-shared-items

[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-connect-dps-shared-items-package)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/hmpps-connect-dps-shared-items-package "Link to report")
[![Test, lint & publish](https://github.com/ministryofjustice/hmpps-connect-dps-shared-items-package/actions/workflows/pipeline.yml/badge.svg?branch=main)](https://github.com/ministryofjustice/hmpps-connect-dps-shared-items-package/actions/workflows/pipeline.yml)

A library for sharing DPS Components across applications.

## Contents

1. [Using the library](#using-the-library)
2. [Library components](#library-components)
3. [For library developers](#for-library-developers)


## Using the library

### Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-connect-dps-shared-items
```

### Nunjucks macro usage

Add the `hmpps-connect-dps-shared-items` assets directory to nunjucks configuration in your application:

```javascript
    const njkEnv = nunjucks.configure(
  [
    path.join(__dirname, '../../server/views'),
    ...,
    'node_modules/@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/',
  ],
  {
    autoescape: true,
    express: app,
  },
)
```

then import the component into your nunjucks file:
```nunjucks
{% from "dps/components/alert-flag/macro.njk" import alertFlag %}
```

### Styling
Include the package scss within the `index.scss` file. You can either import all:
```scss
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/scss/all';
```
or import the specific component scss you are using, e.g:
```scss
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/dps/components/alert-flag/alert-flag';
```

### Client side javascript

In your client side javascript, include:
```js
import * as connectDps from '@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/js/all'

connectDps.initAll()
```

## Library Components:

1. [Alert Flag](readme/components/alertFlag/alert-flag.md)
2. [Address Autosuggest](readme/components/addressAutosuggest/address-autosuggest.md)

## For Library Developers

1. [Publishing to NPM](readme/publishing.md)
