import {
  createEffect,
  createSignal,
  onMount,
  type Accessor,
  type Component,
  type Setter,
} from "solid-js";
import { Octokit } from "octokit";

const API_TOKEN_LOCALSTORAGE_KEY = "genteure_i18n_tools_github_token";

const Input: Component<{
  id: string;
  label: string;
  getValue: Accessor<string>;
  setValue: Setter<string>;
}> = props => {
  return <div class="form-control w-full max-w-xs mx-auto">
    <label class="label" for={props.id}>
      <span class="label-text">{props.label}</span>
    </label>
    <input id={props.id} type="text" class="input input-bordered w-full max-w-xs"
      value={props.getValue()} onChange={e => props.setValue(e.target.value)} />
  </div>;
};

const IconInfo: Component = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 512 512"><path d="M256 90c44.3 0 86 17.3 117.4 48.6C404.7 170 422 211.7 422 256s-17.3 86-48.6 117.4C342 404.7 300.3 422 256 422s-86-17.3-117.4-48.6C107.3 342 90 300.3 90 256s17.3-86 48.6-117.4C170 107.3 211.7 90 256 90m0-42C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z" fill="currentColor"></path><path d="M277 360h-42V235h42v125zm0-166h-42v-42h42v42z" fill="currentColor"></path></svg>
};

const IconWarn: Component = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M85.57 446.25h340.86a32 32 0 0 0 28.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0 0 28.17 47.17Z" /><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m250.26 195.39l5.74 122l5.73-121.95a5.74 5.74 0 0 0-5.79-6h0a5.74 5.74 0 0 0-5.68 5.95Z" /><path fill="currentColor" d="M256 397.25a20 20 0 1 1 20-20a20 20 0 0 1-20 20Z" /></svg>
};

async function fetchData(auth: string, owner: string, repo: string, pr: number, beforeRef: string, afterRef: string): Promise<{
  files: string[];
  beforeHash: string;
  afterHash: string;
}> {
  const octokit = new Octokit({ auth });

  const { repository: { pullRequest: { files: { nodes: fileNodes } } } } = await octokit.graphql.paginate(
    `query allFiles($owner: String!, $repo: String!, $pr: Int!, $num: Int = 100, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pr) {
          files(first: $num, after: $cursor) {
            nodes { path } pageInfo { hasNextPage, endCursor }}}}}`, { owner, repo, pr });

  if (!Array.isArray(fileNodes)) {
    throw new Error("Invalid GitHub API Response");
  }
  const files = fileNodes.map(node => node.path) as string[];

  const { repository: { before: { oid: beforeHash }, after: { oid: afterHash } } } = await octokit.graphql<any>(
    `query commits($owner: String!, $repo: String!, $before: String!, $after: String!){
      repository(owner: $owner, name: $repo) {
        before: object(expression: $before) { oid }
        after: object(expression: $after) { oid }
      }
    }`, { owner, repo, before: beforeRef, after: afterRef });

  if (typeof beforeHash !== "string" || typeof afterHash !== "string") {
    throw new Error("Invalid GitHub API Response");
  }

  return { files, beforeHash, afterHash };
}

const SupportedRepositories: Record<string, {
  sourceBasePath: string;
  stripBasePath: (path: string) => string | null;
}> = {
  "withastro/docs": {
    sourceBasePath: "src/content/docs/en/",
    stripBasePath: (path: string) => {
      // Source: src/content/docs/de/guides/deploy/gitlab.mdx
      // Return: guides/deploy/gitlab.mdx

      if (!path.startsWith("src/content/docs/")) {
        return null;
      }

      const segments = path.split("/");
      if (segments[3] === "en") {
        return null;
      }

      return segments.splice(4).join("/");
    }
  },
  "withastro/starlight": {
    sourceBasePath: "docs/src/content/docs/",
    stripBasePath: (path: string) => {
      // Source: docs/src/content/docs/de/guides/components.mdx
      // Return: guides/components.mdx

      if (!path.startsWith("docs/src/content/docs/")) {
        return null;
      }

      const segments = path.split("/");
      if (segments[4] === "guides" || segments[4] === "reference") {
        return null;
      }

      return segments.splice(5).join("/");
    }
  },
};

function parsePrUrl(url: string) {
  const u = new URL(url);
  const segments = u.pathname.split("/").slice(1);
  console.log(segments);
  const [owner, repo, pull, theNumber] = segments;

  if (pull !== "pull") {
    // not a pull request
    return null;
  }

  if (isNaN(Number(theNumber))) { return null; }
  const pr = parseInt(theNumber);

  const repoPathInfo = SupportedRepositories[`${owner}/${repo}`];
  if (!repoPathInfo) {
    // not a supported repository
    return null;
  }

  return { owner, repo, pr, repoPathInfo };
}

const DescriptionGenerator: Component = () => {
  // loading
  const [loading, setLoading] = createSignal(false);
  // generated markdown description
  const [description, setDescription] = createSignal("");
  // pull request url
  const [prUrl, setPrUrl] = createSignal("");
  // git hash of the original text before this PR
  const [beforeRef, setBeforeRef] = createSignal("");
  // git hash or other ref of the original text after this PR
  const [afterRef, setAfterRef] = createSignal("main");
  // github api token
  const [apiToken, setApiToken] = createSignal("");

  onMount(() => {
    // read api token from local storage
    const token = localStorage.getItem(API_TOKEN_LOCALSTORAGE_KEY);
    if (token) {
      setApiToken(token);
    }
  });

  createEffect(() => {
    // store api token in local storage
    localStorage.setItem(API_TOKEN_LOCALSTORAGE_KEY, apiToken());
  });

  async function generate(e: MouseEvent & { currentTarget: HTMLButtonElement; target: Element; }): Promise<void> {
    const beforeRefValue = beforeRef();
    const afterRefValue = afterRef();

    if (!beforeRefValue || !afterRefValue) {
      return;
    }

    setLoading(true);

    try {
      const urlInfo = parsePrUrl(prUrl());
      if (!urlInfo) {
        throw new Error("Unsupported URL");
      }

      const { owner, repo, pr, repoPathInfo } = urlInfo;
      const { files: changedFiles, beforeHash, afterHash } = await fetchData(apiToken(), owner, repo, pr, beforeRefValue, afterRefValue);
      const files = changedFiles.map(repoPathInfo.stripBasePath).filter(Boolean) as string[];

      let description = `Updated translation based on source texts at [${afterHash.substring(0, 7)}](https://github.com/${owner}/${repo}/tree/${afterHash}).\n\n`;
      description += `| File | Source | Source Diff | Other Links |\n`;
      description += `| --- | --- | --- | --- |\n`;
      for (const file of files) {
        const sourceFile = `${repoPathInfo.sourceBasePath}${file}`;

        var diffURL = new URL(document.location.href);
        diffURL.pathname = "/diff"
        diffURL.hash = `#${owner}/${repo}/${beforeHash}..${afterHash}/${sourceFile}`;

        description += `| \`${file}\` | [source@\`${afterHash.substring(0, 7)}\`](https://github.com/${owner}/${repo}/blob/${afterHash}/${sourceFile}) | `;
        description += `[\`${beforeHash.substring(0, 7)}..${afterHash.substring(0, 7)}\`](${diffURL.href}) | `;
        description += `[blame@\`${afterHash.substring(0, 7)}\`](https://github.com/${owner}/${repo}/blame/${afterHash}/${sourceFile}) <br> `;
        description += `[blame@\`main\`](https://github.com/${owner}/${repo}/blame/main/${sourceFile}) <br> `;
        description += `[history@\`main\`](https://github.com/${owner}/${repo}/commits/main/${sourceFile}) |\n`;
      }

      setDescription(description);
    } catch (error) {
      console.error('Failed to fetch data', error);
      if (error instanceof Error) {
        setDescription(`ERROR: [${error.name}] ${error.message} \n${error.stack} `);
      } else {
        setDescription(`ERROR: ${JSON.stringify(error, null, 2)} `);
      }
    }

    setLoading(false);
  }

  return <div>
    <div>
      <Input id="pr-url" label="PR Url" getValue={prUrl} setValue={setPrUrl} />
      <div class="w-full max-w-sm mx-auto my-2">
        <div class="alert alert-info">
          <IconInfo />
          <span>
            Only <code>withastro/astro</code> and <code>withastro/starlight</code> i18n PRs are supported.
          </span>
        </div>
      </div>
      <Input id="before-ref" label={'Git ref of equivalent source text before this PR'} getValue={beforeRef} setValue={setBeforeRef} />
      <Input id="after-ref" label={'Git ref of source text this PR is translated from'} getValue={afterRef} setValue={setAfterRef} />
      <Input id="api-token" label={'Github API Token'} getValue={apiToken} setValue={setApiToken} />
      <div class="w-full max-w-sm mx-auto my-2">
        <div class="alert alert-info">
          <IconInfo />
          <span>
            Don't have a token? <a target="_blank" class="underline"
              href="https://github.com/settings/personal-access-tokens/new"
            >Create one here</a>.
            <br />
            It doesn't need any permission.
          </span>
        </div>
      </div>
      <div class="w-full max-w-sm mx-auto my-2">
        <div class="alert alert-warning">
          <IconWarn />
          <span>
            Your GitHub API token will be stored in your browser's local storage in plain text.
          </span>
        </div>
      </div>
    </div>
    <div class="my-4 text-center">
      <button class="btn btn-primary align-middle mr-2" disabled={loading()} onClick={e => generate(e)}>
        <span class="absolute loading loading-spinner loading-md" classList={{ hidden: !loading() }}></span>
        <span classList={{ "text-transparent": loading() }}>Generate</span>
      </button>
      <button class="btn btn-secondary align-middle" onClick={e => navigator.clipboard.writeText(description())}>Copy Description</button>
    </div>
    <div class="form-control my-4">
      <label class="label" for="markdown">
        <span class="label-text">Generated markdown description</span>
      </label>
      <textarea id="markdown" readonly class="textarea textarea-bordered h-40" value={description()}></textarea>
    </div>
  </div>;
};

export default DescriptionGenerator;
