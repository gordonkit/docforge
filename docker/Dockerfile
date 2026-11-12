FROM node:25-bookworm-slim AS builder

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# The converter image already holds gordon-doc, LibreOffice Writer and the Noto CJK fonts.
FROM gordonkit/gordon-doc-converter:1.0.0

LABEL org.opencontainers.image.licenses="Apache-2.0" \
    org.opencontainers.image.source="https://github.com/gordonkit/docforge" \
    org.opencontainers.image.description="DocForge CLI with Node.js, Pandoc, gordon-doc and LibreOffice"

# DocForge is tested with this Pandoc release; older ones drop footnotes (docs/cli.md).
ARG PANDOC_VERSION=3.13
ARG PANDOC_SHA256=7e3736f255090296ca5d1a14291a76b9b3c43cd385011b1621a4d0c16091a70f

USER root
RUN apt-get update \
    && apt-get upgrade -y \
    && curl --fail --silent --show-error --location --retry 3 --output /tmp/pandoc.deb \
        "https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-1-amd64.deb" \
    && echo "${PANDOC_SHA256}  /tmp/pandoc.deb" | sha256sum --check \
    && apt-get install --no-install-recommends -y /tmp/pandoc.deb \
    && rm -rf /tmp/pandoc.deb /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=builder /build/package.json ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY examples ./examples
COPY LICENSE NOTICE THIRD_PARTY_NOTICES.md /usr/share/licenses/docforge/
RUN ln -s /app/dist/cli/index.js /usr/local/bin/docforge \
    && chmod 755 /app/dist/cli/index.js

USER gordon
WORKDIR /work
# A writable home on the /tmp tmpfs, so the image also runs read-only and as another user.
ENV HOME=/tmp NODE_ENV=production
# The base image checks its HTTP API; this image only runs the CLI.
HEALTHCHECK NONE
ENTRYPOINT ["docforge"]
CMD ["--help"]
