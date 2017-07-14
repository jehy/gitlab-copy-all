/* eslint-disable no-console*/
const
  Gitlab  = require('gitlab'),
  config  = require('./config/default.json'),
  gitlab  = Gitlab(config.gitlab),
  exec    = require('child-process-promise').exec,
  Promise = require('bluebird'),
  fs      = require('fs-extra');

// Listing projects
function getGitlabProjects() {
  return new Promise((resolve, reject)=> {
    gitlab.projects.all((projects)=> {
      projects = projects.map((project)=> {
        return {ssh_url_to_repo: project.ssh_url_to_repo, namespace_name: project.namespace.name, name: project.name};
      });
      resolve(projects);
    });
  });
}

let promiseChain = Promise.resolve();
getGitlabProjects()
  .then((projects)=> {
    projects.forEach((project)=> {
      console.log(`cloning ${project.name}`);
      const projectDir = `repos/${project.namespace_name}/${project.name}`;
      promiseChain = promiseChain
        .then(()=> {
          return fs.ensureDir(`repos/${project.namespace_name}`);
        })
        .then(()=> {
          return fs.ensureDir(projectDir);
        })
        .then(()=> {
          return exec(`git clone ${project.ssh_url_to_repo} .`, {cwd: projectDir});
        })
        .then(()=> {
          console.log(`cloned ${project.name}`);
        });
    });
    promiseChain.then(()=> {
      console.log('All projects cloned');
    });
  });
