# g5-seo-crawler

This crawler is designed for on-platform locations and takes the URIs from G5 Hub rather than a URL. It can use the sitemap generated from the CMS or it can fallback to link discovery.

It performs various SEO-related checks for on-page markup.

`GET /` Returns heartbeat.

`POST /` Takes a JSON body with at least a `clientUrn` and a `locationUrn`. It also accepts an `enabledAudits` property to enable individual audits. Returns a JSON body with a `results` property.

``` json
{
  "clientUrn": "g5-c-...",
  "locationUrn": "g5-cl-...",
  "enabledAudits": { // optional property
    "alt-text": true,
    "external-links": true,
    "h1": true,
    "internal-links": true,
    "inventory-links": true,
    "keywords": true,
    "nav": true,
    "social-links": true,
    "title-tags": true
  }
}
```

# local

```
cp .env.TEMPLATE .env
# Fill out variables
npm i
npm run dev
```

# deploy

```
npm run docker:build
npm run docker:tag:<either prod or staging>
npm run docker:tag:<either prod or staging>
# staging tags the image with the branch and sha. prod tags the release version.
```

Please deploy in the associated OpEx project as a Cloud Run service.