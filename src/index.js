import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import replace from '@rollup/plugin-replace'
import pipe from 'pipeline.macro'
import { mapKeys, mapValues, shallowMergeAll } from './utils'

const withDefaults = ({
  cwd = '.',
  envKey = 'NODE_ENV',
  preventAssignment = true,
  replaceAllEnvVars = true,
} = {}) => ({
  cwd: path.resolve(process.cwd(), cwd),
  envKey,
  preventAssignment,
  replaceAllEnvVars,
})

export default function dotenvPlugin(inputOptions) {
  const { cwd, envKey, preventAssignment, replaceAllEnvVars } =
    withDefaults(inputOptions)

  return {
    ...replace({
      values: pipe(
        [
          `.env.${process.env[envKey]}.local`,
          `.env.${process.env[envKey]}`,
          '.env.local',
          '.env',
        ],
        (priorities) =>
          [...priorities]
            .reverse()
            .map((dotenvFile) => path.join(cwd, dotenvFile))
            .filter(fs.existsSync)
            .map((dotenvFile) => fs.readFileSync(dotenvFile))
            .map(dotenv.parse),
        shallowMergeAll,
        (envVars) =>
          shallowMergeAll([replaceAllEnvVars ? process.env : {}, envVars]),
        (envVars) => mapKeys((key) => `process.env.${key}`, envVars),
        (envVars) => mapValues((value) => JSON.stringify(value), envVars),
      ),
      preventAssignment,
    }),

    name: 'dotenv',
  }
}
