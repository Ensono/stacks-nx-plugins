module.exports = {
    '*': ['nx affected --target=lint --uncommitted'],
    '**/libs/next-helm-chart/**/*': ['nx affected --target=lint --uncommitted'],
    '*.tf|*.tfvars|.terraform.lock.hcl': [
        'nx affected --target=terraform-fmt --uncommitted',
    ],
};
