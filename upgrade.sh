# bin/bash

DEPLOYMENT="seo-crawler";
CONTEXT=$(kubectl config current-context);
BRANCH=$(git rev-parse --abbrev-ref HEAD);
SHA=$(git rev-parse --short HEAD);
USER=$(gcloud config get-value account | cut -d '@' -f 1);
TAG=$BRANCH-$SHA;
GREEN='\033[0;32m';
NC='\033[0m';

Deploy()
{
  printf "Deploying ${GREEN}$TAG${NC} to ${GREEN}$PROJECT${NC} \n";
  gcloud run deploy $DEPLOYMENT \
    --image gcr.io/g5-images/$DEPLOYMENT:$TAG \
    --allow-unauthenticated \
    --project opex-$PROJECT;
  exit 1;
}

SetProject()
{
  case $CONTEXT in 
    *opex-prod*) PROJECT="prod";;
    *opex-prime*) PROJECT="prime";;
    *opex-staging*) PROJECT="staging-b877";;
    *)
      printf "No deployment found for ${GREEN}$CONTEXT ${NC} \n";
      printf "Please check your kubectl context to use an <opex> cluster \n"
      exit 1;
      ;;
  esac

  while getopts d:p:t: flag
  do
    case "${flag}" in
      d) DEPLOYMENT=${OPTARG};;
      p) PROJECT=${OPTARG};;
      t) TAG=${OPTARG};;
    esac
  done
}

ConfirmInput()
{
  printf "Deploy $DEPLOYMENT to $PROJECT? \n";
  read -p "[y/n]: " CONFIRM;
  if [ "$CONFIRM" != "y" ]; then
    printf "Exiting... \n";
    exit 1;
  fi
  Deploy;
}

SetProject;
ConfirmInput;
