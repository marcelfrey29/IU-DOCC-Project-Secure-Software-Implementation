# BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/29
# 
# # Description
# 
# An end-of-life version of Node.js (Node 18) is used and the container image contains a HIGH-severity vulnerability.
#
# Using outdated and/or vulnerable thrid-party components is classified in OWASP Top 10 A06:2021 (Vulnerable and Outdated 
# Components) and CWE-1104 (Use of Unmaintained Third Party Components). In our case, the used Node 18 image is both 
# vulnerable and outdated.
# The Docker Hub shows one HIGH-severity vulnerability for this image. There is no update available because Node 18 is no
# longer maintained as its reached its End-of-Life on April 30, 2025.
#
# # Impact
#
# Confidentiality, integrity, and availability can no longer be guaranteed or is already violated.
#
# # Background
#
# https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/
# https://cwe.mitre.org/data/definitions/1104.html
# https://nodejs.org/en/about/previous-releases
# https://endoflife.date/nodejs
# https://hub.docker.com/layers/library/node/18-alpine/images/sha256-929b04d7c782f04f615cf785488fed452b6569f87c73ff666ad553a7554f0006
#
# # Remediation
#
# Update the base image so that a current and maintained Node.js version is used. Ideally, a Long Term Support (LTS) 
# Release should be used. Make sure there are no known vulnerabilities in the used image and ensure it comes from a 
# trusted source. 
#
# # Fix
# 
# This issue has been solved automatically by enabling Dependabot which keeps all depdencies up-to-date.
# After its activation, Dependabot opened a Pull Request which updated the old `node:18-alpine` image to `node:24-alpine`
# which is the current active Node.js version which will get LTS support until the end of April 2028.
# PR: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/pull/42
#
# Without Dependabot, a manual update would be necessary, which would include the same changes.
# 
# In general it's a good idea to keep track of the major third-party components because an major update can also come
# with additional development work in case there are breaking changes. 

FROM node:25-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package*json tsconfig.json src ./

RUN npm ci && \
    npm run build && \
    npm prune --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3000

CMD ["node", "/app/dist/index.js"]