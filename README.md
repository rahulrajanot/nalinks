# NA Environment Portal

A static web portal for links to OpenText Network Automation lab environments. The application is served by Nginx, built by GitHub Actions, stored in GitHub Container Registry, and deployed to Kubernetes by Argo CD.

## Repository layout

- `app/`: frontend and environment data
- `k8s/`: Namespace, Deployment, and NodePort Service
- `argocd/`: Argo CD Application
- `.github/workflows/`: image build and manifest update workflow
- `Dockerfile`: Nginx application image

## Replace the existing repository content

Back up anything needed, then copy the extracted files into the repository root:

```bash
unzip nalinks-full-argocd-app.zip -d /tmp/nalinks-new
cd /path/to/NAsite
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a /tmp/nalinks-new/. .
git add .
git commit -m "Add complete NA Portal GitOps application"
git push origin main
```

## GitHub settings

The workflow requires `Read and write permissions` for GitHub Actions:

`Repository Settings -> Actions -> General -> Workflow permissions -> Read and write permissions`

The workflow publishes `ghcr.io/rahulrajanot/nalinks:<commit-sha>` and updates `k8s/deployment.yaml`.

If the GHCR package is private, create an image pull secret in `naportal` and add it to the Deployment. Do not commit a token.

## Apply the Argo CD Application

```bash
kubectl apply -f argocd/application.yaml -n argocd
kubectl get applications -n argocd
kubectl get all -n naportal
```

## Access the portal

The Service uses NodePort `30080`:

```bash
kubectl get nodes -o wide
kubectl get service -n naportal
```

Open `http://NODE-IP:30080` in a browser that can reach the Kubernetes node.

## Local test

```bash
docker build -t na-portal:local .
docker run --rm -p 8080:80 na-portal:local
```

Then open `http://localhost:8080`.

## Update environments

Edit `app/versions.json`, commit, and push. GitHub Actions builds a new image and commits the new image tag. Argo CD detects the manifest commit and synchronizes it.
