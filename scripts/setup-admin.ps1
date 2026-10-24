$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$repoRoot = Split-Path $PSScriptRoot -Parent
$bunCommand = Get-Command bun -ErrorAction SilentlyContinue
$bunPath = if ($bunCommand) { $bunCommand.Source } else { Join-Path $env:LOCALAPPDATA 'LabasPreview/Bun/bin/bun.exe' }
$cliPath = Join-Path $repoRoot 'packages/api/src/scripts/setup-local-admin.ts'

try {
    if (-not (Test-Path -LiteralPath $bunPath)) { throw '未找到 Bun，请先安装项目依赖。' }
    Push-Location $repoRoot
    try {
        $result = & $bunPath run $cliPath --list 2>&1
        if ($LASTEXITCODE -ne 0) { throw ($result -join "`n") }
        $state = ($result -join "`n") | ConvertFrom-Json
    } finally { Pop-Location }
    if ($state.hasAdministrator) {
        [System.Windows.Forms.MessageBox]::Show('本地已有管理员。请使用管理员账号登录；后续账号权限由后台的用户管理设置。', '管理员已开通') | Out-Null
        exit 0
    }
    if (@($state.users).Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show('请先在网站注册自己的账号，然后重新打开这个工具。无需把密码发给任何人。', '尚未注册账号') | Out-Null
        exit 0
    }

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'DUNCAN｜首次开通本地管理员'
    $form.Size = New-Object System.Drawing.Size(660, 340)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.TopMost = $true
    $form.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 10)

    $intro = New-Object System.Windows.Forms.Label
    $intro.SetBounds(22, 20, 600, 66)
    $intro.Text = "请选择你在网站注册的账号。`r`n只修改这个账号的本地管理员身份，不读取或修改密码。"
    $form.Controls.Add($intro)

    $accounts = New-Object System.Windows.Forms.ComboBox
    $accounts.SetBounds(22, 92, 600, 36)
    $accounts.DropDownStyle = 'DropDownList'
    foreach ($candidate in @($state.users)) { [void]$accounts.Items.Add("$($candidate.name)  <$($candidate.email)>") }
    $accounts.SelectedIndex = -1
    $form.Controls.Add($accounts)

    $status = New-Object System.Windows.Forms.Label
    $status.SetBounds(22, 142, 600, 60)
    $status.Text = '请选择账号后，点击“为选中账号开通”。此工具只支持本项目的隔离本地开发库。'
    $form.Controls.Add($status)

    $grant = New-Object System.Windows.Forms.Button
    $grant.SetBounds(22, 220, 240, 44)
    $grant.Text = '为选中账号开通'
    $grant.Enabled = $false
    $form.Controls.Add($grant)
    $close = New-Object System.Windows.Forms.Button
    $close.SetBounds(482, 220, 140, 44)
    $close.Text = '关闭'
    $close.Add_Click({ $form.Close() })
    $form.Controls.Add($close)
    $accounts.Add_SelectedIndexChanged({ $grant.Enabled = $accounts.SelectedIndex -ge 0 })
    $grant.Add_Click({
        $grant.Enabled = $false
        $accounts.Enabled = $false
        try {
            $target = @($state.users)[$accounts.SelectedIndex]
            Push-Location $repoRoot
            try {
                $grantResult = & $bunPath run $cliPath --grant $target.id --confirm 2>&1
                if ($LASTEXITCODE -ne 0) { throw ($grantResult -join "`n") }
            } finally { Pop-Location }
            $status.ForeColor = [System.Drawing.Color]::DarkGreen
            $status.Text = '管理员已开通。返回网站刷新后台页面即可，无需重新注册或提供密码。'
            $grant.Text = '已开通'
        } catch {
            $status.ForeColor = [System.Drawing.Color]::DarkRed
            $status.Text = [string]$_.Exception.Message
            $accounts.Enabled = $true
            $grant.Enabled = $accounts.SelectedIndex -ge 0
        }
    })
    [void]$form.ShowDialog()
} catch {
    [System.Windows.Forms.MessageBox]::Show([string]$_.Exception.Message, '本地管理员开通未完成') | Out-Null
    exit 1
}
