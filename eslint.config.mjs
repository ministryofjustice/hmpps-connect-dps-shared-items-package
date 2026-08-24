import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['src/assets', '!src/assets/**/*.ts'],
  extraPathsAllowingDevDependencies: ['jest.config.mjs', 'rollup.config.ts', 'preview/*'],
})
