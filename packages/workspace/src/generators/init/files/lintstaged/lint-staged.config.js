module.exports = {
    '*': ['nx affected --target=lint --uncommitted'],
    '**/build/helm/**/*': ['nx affected --target=helm-lint --uncommitted'],
    '*.tf|*.tfvars|.terraform.lock.hcl': [
        'nx affected --target=terraform-fmt --uncommitted',
    ],
};
