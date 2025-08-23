#!/usr/bin/env node
import { graphql as baseGraphql } from '@octokit/graphql';
import { promises as fs } from 'fs';

const owner = process.env.GITHUB_REPOSITORY_OWNER || 'xcodeprem';
const token = process.env.GH_PROJECT_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing GH_PROJECT_TOKEN or GITHUB_TOKEN');
  process.exit(1);
}
const graphql = baseGraphql.defaults({ headers: { authorization: `token ${token}` } });

async function main() {
  try {
    const data = await graphql('query($owner:String!) { user(login: $owner) { login projectsV2(first: 5) { nodes { title number url } } } }', { owner });
    const projects = data?.user?.projectsV2?.nodes || [];
    const out = { owner: data?.user?.login, projects: projects.map(p => ({ title: p.title, number: p.number, url: p.url })) };
    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile('artifacts/project-token-diagnostics.json', JSON.stringify(out, null, 2));
    console.log('Token access OK. Wrote artifacts/project-token-diagnostics.json');
  } catch (e) {
    console.error('Token access failed:', e.message);
    process.exit(2);
  }
}
main();
