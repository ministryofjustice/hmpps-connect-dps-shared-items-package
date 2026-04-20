import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['src/assets'],
  extraPathsAllowingDevDependencies: ['jest.config.mjs', 'rollup.config.ts'],
})
