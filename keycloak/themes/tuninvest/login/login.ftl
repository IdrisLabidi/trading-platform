<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=true; section>
<!-- template: login.ftl (TunInvest custom) -->

    <#if section = "header">
        ${msg("doLogIn")}
    <#elseif section = "form">
        <#-- The custom form is fully rendered inside the "info" section below,
             so we intentionally leave the default PatternFly form slot empty. -->
    <#elseif section = "info" >
        <#-- We render the entire custom card here, including the form,
             so the layout macro places it in the same area where the
             default Keycloak form lives. -->
        <#assign usernameError = messagesPerField.getFirstError("username","password")!"" />
        <#assign usernameLabel>
            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
        </#assign>

        <div class="tuninvest-card" role="region" aria-labelledby="tuninvest-title">
            <span class="card-badge">${msg("tuninvestBadge")}</span>
            <h1 id="tuninvest-title">${msg("tuninvestLoginTitle")}<span>${msg("tuninvestLoginHighlight")}</span></h1>
            <p class="card-subtitle">${msg("tuninvestLoginSubtitle")}</p>

            <#if message?has_content && (message.type != "warning" || !isAppInitiatedAction??)>
                <div class="tuninvest-alert tuninvest-alert-${(message.type = "error")?then("error", message.type)}" role="alert">
                    <#if message.type = "success">&#10003;</#if>
                    <#if message.type = "warning">&#9888;</#if>
                    <#if message.type = "error">&#10006;</#if>
                    <#if message.type = "info">&#8505;</#if>
                    <span>${message.summary}</span>
                </div>
            </#if>

            <#if realm.password>
                <form id="kc-form-login"
                      class="tuninvest-form"
                      onsubmit="return true;"
                      action="${url.loginAction}"
                      method="post"
                      novalidate="novalidate">
                    <input type="hidden" id="id-hidden-input" name="credentialId"
                           <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

                    <#if !usernameHidden??>
                        <div class="field <#if usernameError?has_content>has-error</#if>">
                            <label for="username">${usernameLabel}</label>
                            <div class="input-shell">
                                <span class="input-icon" aria-hidden="true">&#128100;</span>
                                <input id="username"
                                       name="username"
                                       type="text"
                                       value="${login.username!""}"
                                       autocomplete="${(enableWebAuthnConditionalUI?has_content)?then("username webauthn", "username")}"
                                       autofocus
                                       aria-invalid="<#if usernameError?has_content>true</#if>"
                                       required />
                            </div>
                            <div class="field-error">
                                <#if usernameError?has_content>${kcSanitize(usernameError)}</#if>
                            </div>
                        </div>
                    </#if>

                    <div class="field">
                        <label for="password">${msg("password")}</label>
                        <div class="input-shell">
                            <span class="input-icon" aria-hidden="true">&#128274;</span>
                            <input id="password"
                                   name="password"
                                   type="password"
                                   autocomplete="current-password"
                                   <#if usernameHidden??>autofocus</#if>
                                   required />
                            <button type="button"
                                    class="toggle-pwd"
                                    aria-label="${msg("showPassword")}"
                                    aria-controls="password"
                                    data-password-toggle
                                    data-icon-show="&#128065;"
                                    data-icon-hide="&#128064;"
                                    data-label-show="${msg("showPassword")}"
                                    data-label-hide="${msg("hidePassword")}"
                                    id="password-show-password">
                                <span aria-hidden="true">&#128065;</span>
                            </button>
                        </div>
                        <div class="field-error"></div>
                    </div>

                    <#if realm.rememberMe && !usernameHidden??>
                        <div class="form-row">
                            <label class="remember" for="rememberMe">
                                <input id="rememberMe" name="rememberMe" type="checkbox"
                                       <#if login.rememberMe??>checked</#if> />
                                <span>${msg("rememberMe")}</span>
                            </label>
                            <#if realm.resetPasswordAllowed>
                                <a href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                            </#if>
                        </div>
                    <#else>
                        <#if realm.resetPasswordAllowed>
                            <div class="form-row">
                                <span></span>
                                <a href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                            </div>
                        </#if>
                    </#if>

                    <button type="submit" id="kc-login" name="login">
                        <span>${msg("doLogIn")}</span>
                        <span aria-hidden="true">&#8594;</span>
                    </button>
                </form>
            </#if>

            <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
                <div class="tuninvest-register">
                    <span>${msg("noAccount")} <a href="${url.registrationUrl}">${msg("doRegister")}</a></span>
                </div>
            </#if>
        </div>
    </#if>

</@layout.registrationLayout>
