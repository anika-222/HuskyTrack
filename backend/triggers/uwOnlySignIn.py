def lambda_handler(event, context):
    email = (
        event.get("request", {})
        .get("userAttributes", {})
        .get("email", "")
        .strip()
        .lower()
    )

    # Restrict to @uw.edu
    if not email.endswith("@uw.edu"):
        # Proper structure for PreSignUp return
        event["response"] = {
            "autoConfirmUser": False,
            "autoVerifyEmail": False,
        }

        # The trick: instead of custom field, raise ValidationError Cognito understands
        raise Exception("Please use your UW email (@uw.edu) to sign up.")

    # Allow valid users
    event["response"] = {
        "autoConfirmUser": True,
        "autoVerifyEmail": True,
    }

    return event
