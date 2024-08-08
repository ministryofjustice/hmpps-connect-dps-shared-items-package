# hmpps-connect-dps-shared-items-package
A library for sharing dps components across applications

## Contents

1. [Publishing to NPM](readme/publishing.md)

## Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-connect-dps-shared-items
```

## Nunjucks macro usage

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
Include the package scss within the all.scss file. You can either import all:
```scss
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/scss/all';
```
or import the specific component scss you are using, e.g:
```scss
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/dps/components/alrt-flag/alert-flag';
```
import the component into your nunkucks file:
```javascript
{% from "dps/components/alert-flag/macro.njk" import alertFlag %}
```

## Components:

1. [Alert flag](readme/components/alert-flag.md)