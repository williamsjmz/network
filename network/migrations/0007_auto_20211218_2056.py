# Generated by Django 3.2.9 on 2021-12-18 20:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0006_profile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='banner_picture',
            field=models.ImageField(blank=True, upload_to="{% static 'network/img/banners/' %}"),
        ),
        migrations.AlterField(
            model_name='profile',
            name='profile_picture',
            field=models.ImageField(blank=True, upload_to="{% static 'network/img/profile-pictures/' %}"),
        ),
    ]